import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';

const port = Number(process.env.PORT) || 4000;
let uri = process.env.MONGODB_URI;
let memory;

if (!uri) {
  // No database configured: run against a throwaway in-memory MongoDB (data resets on restart).
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memory = await MongoMemoryServer.create();
  uri = memory.getUri();
  console.log('MONGODB_URI not set: using an in-memory MongoDB (data is lost on exit)');
}

await mongoose.connect(uri);
const server = createApp().listen(port, () => console.log(`Listening on http://localhost:${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    server.close();
    await mongoose.disconnect();
    await memory?.stop();
    process.exit(0);
  });
}
