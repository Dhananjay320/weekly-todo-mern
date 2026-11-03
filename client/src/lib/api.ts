import type { Task, TaskInput, Status } from './types'

/** No accounts: each browser gets a random id that scopes its tasks on the server. */
function clientId(): string {
  const KEY = 'todo.clientId'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}

export class ApiError extends Error {
  status: number
  fields: Record<string, string>
  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'X-Client-Id': clientId(), ...init.headers },
    })
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again")
  }
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, body.error?.message ?? 'Something went wrong', body.error?.fields)
  return body as T
}

export const api = {
  list: (q?: string) => request<{ tasks: Task[] }>(q ? `/tasks?q=${encodeURIComponent(q)}` : '/tasks').then((r) => r.tasks),
  create: (input: TaskInput) => request<{ task: Task }>('/tasks', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.task),
  update: (id: string, patch: Partial<TaskInput> & { status?: Status }) =>
    request<{ task: Task }>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).then((r) => r.task),
  remove: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  sample: () =>
    request<{ tasks: Task[] }>('/tasks/sample', { method: 'POST', body: JSON.stringify({ tzOffset: new Date().getTimezoneOffset() }) }).then((r) => r.tasks),
}
