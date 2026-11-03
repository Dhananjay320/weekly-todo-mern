import mongoose from 'mongoose';

export const PRIORITIES = ['low', 'medium', 'high'];
export const STATUSES = ['in-progress', 'completed'];

const taskSchema = new mongoose.Schema(
  {
    // Anonymous owner: a random id the browser keeps in localStorage (there are no accounts in this app).
    clientId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    // When the task is scheduled (date + start time). Required by the spec.
    startAt: { type: Date, required: true },
    // Optional end time, from the "Set Time: Start / Ends" fields in the design.
    endAt: { type: Date, default: null },
    priority: { type: String, enum: [...PRIORITIES, null], default: null },
    status: { type: String, enum: STATUSES, default: 'in-progress' },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ clientId: 1, startAt: 1 });

taskSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.clientId;
    return ret;
  },
});

export const Task = mongoose.model('Task', taskSchema);
