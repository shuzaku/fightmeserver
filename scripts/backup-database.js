/**
 * Export all collections in the Fighters-Edge database to JSON files.
 *
 * Usage:
 *   node scripts/backup-database.js
 *   node scripts/backup-database.js --out backups/my-backup
 *
 * Requires DB_USERNAME and DB_PASSWORD in .env (project root).
 */

'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const DB_NAME = 'Fighters-Edge';

function defaultBackupDir() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(__dirname, '..', 'backups', DB_NAME + '-' + stamp);
}

function serializeDoc(doc) {
  return JSON.parse(JSON.stringify(doc));
}

async function exportCollection(db, name, outDir) {
  const collection = db.collection(name);
  const count = await collection.countDocuments();
  const filePath = path.join(outDir, name + '.json');

  if (count === 0) {
    fs.writeFileSync(filePath, '[]\n', 'utf8');
    return { name, count, filePath, bytes: 2 };
  }

  const cursor = collection.find({}).batchSize(500);
  const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
  stream.write('[\n');

  let index = 0;
  let doc = await cursor.next();
  while (doc != null) {
    if (index > 0) {
      stream.write(',\n');
    }
    stream.write(JSON.stringify(serializeDoc(doc), null, 2));
    index += 1;
    doc = await cursor.next();
  }

  stream.write('\n]\n');
  await new Promise((resolve, reject) => {
    stream.end(resolve);
    stream.on('error', reject);
  });

  const bytes = fs.statSync(filePath).size;
  return { name, count, filePath, bytes };
}

async function run() {
  const { DB_USERNAME, DB_PASSWORD } = process.env;
  if (!DB_USERNAME || !DB_PASSWORD) {
    console.error('Set DB_USERNAME and DB_PASSWORD in .env first.');
    process.exit(1);
  }

  const outArg = process.argv.indexOf('--out');
  const outDir =
    outArg !== -1 && process.argv[outArg + 1]
      ? path.resolve(process.argv[outArg + 1])
      : defaultBackupDir();

  fs.mkdirSync(outDir, { recursive: true });

  const connStr =
    'mongodb+srv://' +
    DB_USERNAME +
    ':' +
    DB_PASSWORD +
    '@cluster0.vdh52.mongodb.net/' +
    DB_NAME +
    '?retryWrites=true&w=majority';

  await mongoose.connect(connStr, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000,
  });

  console.log('Connected to MongoDB');
  console.log('Backup directory:', outDir);

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const names = collections
    .map((c) => c.name)
    .filter((name) => !name.startsWith('system.'))
    .sort();

  const manifest = {
    database: DB_NAME,
    createdAt: new Date().toISOString(),
    collections: [],
    totalDocuments: 0,
    totalBytes: 0,
  };

  for (const name of names) {
    process.stdout.write('Exporting ' + name + '... ');
    const result = await exportCollection(db, name, outDir);
    manifest.collections.push({
      name: result.name,
      documents: result.count,
      file: path.basename(result.filePath),
      bytes: result.bytes,
    });
    manifest.totalDocuments += result.count;
    manifest.totalBytes += result.bytes;
    console.log(result.count + ' docs');
  }

  const manifestPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log('\nBackup complete.');
  console.log('Collections:', names.length);
  console.log('Documents:', manifest.totalDocuments);
  console.log('Size (bytes):', manifest.totalBytes);
  console.log('Manifest:', manifestPath);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
