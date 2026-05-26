import 'dotenv/config';
import mongoose from 'mongoose';
import * as readline from 'readline';
import User from '../src/models/User.model';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise((res) => rl.question(q, res));

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('Connected to MongoDB\n');  

  const name = await ask('Name: ');
  const email = await ask('Email: ');
  const password = await ask('Password (min 6 chars): ');

  if (!name.trim() || !email.trim() || password.length < 6) {
    console.error('Invalid input. Aborting.');
    process.exit(1);
  }

  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    console.error(`A user with email "${email.trim()}" already exists.`);
    process.exit(1);
  }

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: 'admin',
  });

  console.log(`\nAdmin account created:`);
  console.log(`  Name:  ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Role:  ${user.role}`);

  await mongoose.disconnect();
  rl.close();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
