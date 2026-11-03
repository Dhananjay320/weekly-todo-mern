export type Priority = 'low' | 'medium' | 'high'
export type Status = 'in-progress' | 'completed'

export interface Task {
  id: string
  title: string
  description: string
  /** ISO date-time of the task's date and start time. */
  startAt: string
  endAt: string | null
  priority: Priority | null
  status: Status
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskInput {
  title: string
  description: string
  startAt: string
  endAt: string | null
  priority: Priority | null
}

export const PRIORITY_LABEL: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' }
