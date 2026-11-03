import { z } from 'zod';
import { PRIORITIES, STATUSES } from './task.model.js';

const isoDate = z.iso.datetime({ offset: true, error: 'Must be an ISO date-time' }).transform((v) => new Date(v));
const priority = z.enum(PRIORITIES, { error: 'Priority must be low, medium or high' }).nullable();
const status = z.enum(STATUSES, { error: 'Status must be in-progress or completed' });

const fields = {
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title must be at most 120 characters'),
  description: z.string().trim().max(1000, 'Description must be at most 1000 characters'),
  startAt: isoDate,
  endAt: isoDate.nullable(),
  priority,
  status,
};

const endAfterStart = (v) => !v.endAt || !v.startAt || v.endAt >= v.startAt;
const endMessage = { message: 'End time must be after the start time', path: ['endAt'] };

export const createSchema = z
  .object({
    title: fields.title,
    description: fields.description.optional().default(''),
    startAt: fields.startAt,
    endAt: fields.endAt.optional().default(null),
    priority: fields.priority.optional().default(null),
    status: fields.status.optional().default('in-progress'),
  })
  .refine(endAfterStart, endMessage);

// PATCH: every field optional and no defaults, so fields left out stay unchanged.
export const updateSchema = z
  .object({
    title: fields.title.optional(),
    description: fields.description.optional(),
    startAt: fields.startAt.optional(),
    endAt: fields.endAt.optional(),
    priority: fields.priority.optional(),
    status: fields.status.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});
