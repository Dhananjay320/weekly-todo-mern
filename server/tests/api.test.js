import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { sampleTasks } from '../src/sample.js';

let mongo;
const app = createApp();
const A = 'client-aaaaaaaaaaaaaaaa';
const B = 'client-bbbbbbbbbbbbbbbb';
const as = (id) => ({
  get: (url) => request(app).get(url).set('X-Client-Id', id),
  post: (url, body) => request(app).post(url).set('X-Client-Id', id).send(body),
  patch: (url, body) => request(app).patch(url).set('X-Client-Id', id).send(body),
  del: (url) => request(app).delete(url).set('X-Client-Id', id),
});

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
beforeEach(() => mongoose.connection.db.dropDatabase());

const task = (over = {}) => ({ title: 'Meeting with team', startAt: '2026-11-02T10:00:00.000Z', ...over });

describe('tasks API', () => {
  it('needs a client id', async () => {
    expect((await request(app).get('/api/tasks')).status).toBe(400);
  });

  it('creates a task with defaults and requires title and date-time', async () => {
    const res = await as(A).post('/api/tasks', task({ description: 'Weekly sync', priority: 'high' }));
    expect(res.status).toBe(201);
    expect(res.body.task).toMatchObject({ title: 'Meeting with team', description: 'Weekly sync', priority: 'high', status: 'in-progress', endAt: null, completedAt: null });

    const bad = await as(A).post('/api/tasks', { title: ' ', priority: 'urgent' });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.fields).sort()).toEqual(['priority', 'startAt', 'title']);
  });

  it('rejects an end time before the start time', async () => {
    const res = await as(A).post('/api/tasks', task({ endAt: '2026-11-02T09:00:00.000Z' }));
    expect(res.status).toBe(400);
    expect(res.body.error.fields.endAt).toMatch(/after the start/);
  });

  it('edits fields, marks completed / in progress, and deletes', async () => {
    const { id } = (await as(A).post('/api/tasks', task({ description: 'keep me' }))).body.task;
    const done = await as(A).patch(`/api/tasks/${id}`, { status: 'completed', priority: 'low' });
    expect(done.body.task).toMatchObject({ status: 'completed', priority: 'low', description: 'keep me' });
    expect(done.body.task.completedAt).toEqual(expect.any(String));

    const reopened = await as(A).patch(`/api/tasks/${id}`, { status: 'in-progress' });
    expect(reopened.body.task.completedAt).toBeNull();

    expect((await as(A).patch(`/api/tasks/${id}`, {})).status).toBe(400);
    expect((await as(A).del(`/api/tasks/${id}`)).status).toBe(204);
    expect((await as(A).get(`/api/tasks/${id}`)).status).toBe(404);
  });

  it('searches title and description, case-insensitively', async () => {
    await as(A).post('/api/tasks', task({ title: 'Buy cat food' }));
    await as(A).post('/api/tasks', task({ title: 'Gym', description: 'Then FEED the cat' }));
    await as(A).post('/api/tasks', task({ title: 'Dentist' }));
    const res = await as(A).get('/api/tasks?q=CAT');
    expect(res.body.tasks.map((t) => t.title).sort()).toEqual(['Buy cat food', 'Gym']);
    // Regex characters are treated literally.
    expect((await as(A).get('/api/tasks?q=.*')).body.tasks).toEqual([]);
  });

  it('filters by date range and sorts by start time', async () => {
    await as(A).post('/api/tasks', task({ title: 'later', startAt: '2026-11-05T10:00:00.000Z' }));
    await as(A).post('/api/tasks', task({ title: 'earlier', startAt: '2026-11-03T10:00:00.000Z' }));
    await as(A).post('/api/tasks', task({ title: 'next week', startAt: '2026-11-10T10:00:00.000Z' }));
    const res = await as(A).get('/api/tasks?from=2026-11-02T00:00:00.000Z&to=2026-11-09T00:00:00.000Z');
    expect(res.body.tasks.map((t) => t.title)).toEqual(['earlier', 'later']);
  });

  it("keeps each browser's tasks separate", async () => {
    const { id } = (await as(A).post('/api/tasks', task())).body.task;
    expect((await as(B).get('/api/tasks')).body.tasks).toEqual([]);
    expect((await as(B).get(`/api/tasks/${id}`)).status).toBe(404);
    expect((await as(B).patch(`/api/tasks/${id}`, { title: 'x' })).status).toBe(404);
    expect((await as(B).del(`/api/tasks/${id}`)).status).toBe(404);
    expect((await as(A).get(`/api/tasks/${id}`)).body.task.title).toBe('Meeting with team');
  });

  it('answers malformed ids with 404 and unknown API routes with 404 JSON', async () => {
    expect((await as(A).get('/api/tasks/nope')).status).toBe(404);
    const res = await request(app).get('/api/nothing');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('adds sample tasks at the visitor\'s local times', async () => {
    const res = await as(A).post('/api/tasks/sample', { tzOffset: -330 });
    expect(res.status).toBe(201);
    expect(res.body.tasks.length).toBeGreaterThan(5);
    // 09:30 in India (UTC+5:30) is 04:00 UTC.
    const wireframe = res.body.tasks.find((t) => t.title === 'Finishing wireframe');
    expect(wireframe.startAt.slice(11, 16)).toBe('04:00');
  });
});

describe('sampleTasks', () => {
  it('uses the visitor time zone for the wall-clock time', () => {
    const [first] = sampleTasks(new Date('2026-11-03T12:00:00Z'), 0);
    expect(first.startAt.toISOString()).toBe('2026-10-26T10:00:00.000Z');
  });
});
