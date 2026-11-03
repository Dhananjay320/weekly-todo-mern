import { Router } from 'express';
import mongoose from 'mongoose';
import { Task } from './task.model.js';
import { createSchema, updateSchema, listQuerySchema } from './schemas.js';
import { sampleTasks } from './sample.js';

export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    Object.assign(this, { status, code, fields });
  }
}

const notFound = () => new HttpError(404, 'NOT_FOUND', 'Task not found');

function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;
  const fields = {};
  for (const issue of result.error.issues) fields[issue.path.join('.') || '_'] ??= issue.message;
  throw new HttpError(400, 'VALIDATION_ERROR', 'Please fix the highlighted fields', fields);
}

/** Every request carries the browser's anonymous id; all queries are scoped to it. */
function requireClient(req, _res, next) {
  const id = req.get('x-client-id');
  if (!id || !/^[A-Za-z0-9-]{16,64}$/.test(id)) {
    throw new HttpError(400, 'MISSING_CLIENT_ID', 'Missing or invalid X-Client-Id header');
  }
  req.clientId = id;
  next();
}

function validId(req, _res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) throw notFound();
  next();
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const tasksRouter = Router();
tasksRouter.use(requireClient);

// GET /api/tasks?q=keyword&from=ISO&to=ISO  → tasks sorted by start time
tasksRouter.get('/', async (req, res) => {
  const { q, from, to } = parse(listQuerySchema, req.query);
  const filter = { clientId: req.clientId };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }
  if (from || to) filter.startAt = { ...(from && { $gte: from }), ...(to && { $lt: to }) };
  const tasks = await Task.find(filter).sort({ startAt: 1, createdAt: 1 }).limit(1000);
  res.json({ tasks });
});

tasksRouter.post('/', async (req, res) => {
  const body = parse(createSchema, req.body);
  const task = await Task.create({
    ...body,
    clientId: req.clientId,
    completedAt: body.status === 'completed' ? new Date() : null,
  });
  res.status(201).json({ task });
});

// Adds a handful of example tasks around the current week, for an empty list.
tasksRouter.post('/sample', async (req, res) => {
  const offset = Number(req.body?.tzOffset);
  const tzOffset = Number.isInteger(offset) && Math.abs(offset) <= 840 ? offset : 0;
  const docs = sampleTasks(new Date(), tzOffset).map((t) => ({ ...t, clientId: req.clientId }));
  const tasks = await Task.insertMany(docs);
  res.status(201).json({ tasks });
});

async function findOwn(req) {
  const task = await Task.findOne({ _id: req.params.id, clientId: req.clientId });
  if (!task) throw notFound();
  return task;
}

tasksRouter.get('/:id', validId, async (req, res) => {
  res.json({ task: await findOwn(req) });
});

tasksRouter.patch('/:id', validId, async (req, res) => {
  const body = parse(updateSchema, req.body);
  const task = await findOwn(req);
  task.set(body);
  const endAt = task.endAt;
  if (endAt && endAt < task.startAt) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Please fix the highlighted fields', { endAt: 'End time must be after the start time' });
  }
  if (body.status) task.completedAt = body.status === 'completed' ? task.completedAt ?? new Date() : null;
  await task.save();
  res.json({ task });
});

tasksRouter.delete('/:id', validId, async (req, res) => {
  const task = await findOwn(req);
  await task.deleteOne();
  res.status(204).end();
});
