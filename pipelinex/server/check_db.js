import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pipelinex';

async function check() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');
  const db = mongoose.connection.db;
  const pipelines = await db.collection('pipelines').find({}).toArray();
  console.log('Pipelines found:', pipelines.length);
  pipelines.forEach(p => console.log(JSON.stringify(p, null, 2)));
  process.exit(0);
}

check();
