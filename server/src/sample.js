// Example tasks spread over last week, this week and next week, relative to `now`.
const SAMPLES = [
  // [day offset from today, hour, minutes, duration minutes, title, description, priority, completed]
  [-8, 10, 0, 60, 'Plan sprint goals', 'Pick the three goals for the next sprint.', 'medium', true],
  [-6, 16, 30, 30, 'Pay electricity bill', '', 'high', true],
  [-5, 9, 0, 45, 'Gym session', 'Leg day.', 'low', false],
  [0, 9, 30, 90, 'Finishing wireframe', 'Home, new task and search screens.', 'high', false],
  [0, 11, 0, 60, 'Meeting with team', 'Weekly sync on the mobile app.', 'medium', false],
  [0, 18, 0, 30, 'Buy cat food', '', 'low', true],
  [1, 14, 0, 120, 'Finishing daily commission', 'Send the illustrations to the client.', 'medium', true],
  [2, 10, 0, 60, 'Review pull requests', 'Search and week-summary features.', 'high', false],
  [3, 19, 0, 60, 'Call parents', '', null, false],
  [7, 10, 0, 60, 'Dentist appointment', 'Bring the insurance card.', 'medium', false],
  [9, 15, 0, 90, 'Write blog post', 'How we group tasks by week.', 'low', false],
];

/**
 * @param now current time
 * @param tzOffset the browser's Date#getTimezoneOffset() (minutes, e.g. -330 for India), so "10:00"
 *   means 10:00 for the visitor and not for the server.
 */
export function sampleTasks(now, tzOffset = 0) {
  const local = new Date(now.getTime() - tzOffset * 60_000); // visitor's wall clock, read via UTC getters
  return SAMPLES.map(([day, h, m, dur, title, description, priority, done]) => {
    const wall = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + day, h, m);
    const startAt = new Date(wall + tzOffset * 60_000);
    return {
      title,
      description,
      priority,
      startAt,
      endAt: new Date(startAt.getTime() + dur * 60_000),
      status: done ? 'completed' : 'in-progress',
      completedAt: done ? startAt : null,
    };
  });
}
