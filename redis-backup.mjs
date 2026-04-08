// Redis backup using Upstash REST API via curl
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const URL = 'https://eminent-adder-88727.upstash.io';
const TOKEN = 'gQAAAAAAAVqXAAIncDI1NDJhYTJlYzk1ZTI0MGFiOWEzN2I2NWQ3NjYyMmNhM3AyODg3Mjc';

function redisCmd(args) {
  // Write body to temp file to avoid shell escaping issues
  const tmpFile = path.join(os.tmpdir(), 'redis-cmd.json');
  fs.writeFileSync(tmpFile, JSON.stringify(args));
  const result = execSync(
    `curl -s -X POST "${URL}" -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d @${tmpFile}`,
    { encoding: 'utf8', timeout: 30000 }
  );
  const parsed = JSON.parse(result);
  if (parsed.error) throw new Error(parsed.error);
  return parsed.result;
}

// Step 1: Get all keys
let cursor = '0';
let allKeys = [];
do {
  const result = redisCmd(['SCAN', cursor, 'COUNT', '200']);
  cursor = result[0];
  allKeys = allKeys.concat(result[1]);
} while (cursor !== '0');

console.log('Found ' + allKeys.length + ' keys');

// Step 2: Get type and value for each key
const backup = {};
for (const key of allKeys) {
  try {
    const type = redisCmd(['TYPE', key]);
    let value;
    if (type === 'string') {
      value = redisCmd(['GET', key]);
    } else if (type === 'list') {
      value = redisCmd(['LRANGE', key, '0', '-1']);
    } else if (type === 'set') {
      value = redisCmd(['SMEMBERS', key]);
    } else if (type === 'hash') {
      value = redisCmd(['HGETALL', key]);
    } else if (type === 'zset') {
      value = redisCmd(['ZRANGE', key, '0', '-1', 'WITHSCORES']);
    } else {
      value = redisCmd(['GET', key]);
    }
    // Try to parse JSON string values
    if (type === 'string' && typeof value === 'string') {
      try { value = JSON.parse(value); } catch (_) {}
    }
    backup[key] = { type, value };
    const size = JSON.stringify(value).length;
    console.log('  ' + key + ' (' + type + ', ' + (size / 1024).toFixed(1) + ' KB)');
  } catch (e) {
    console.error('  ERROR ' + key + ': ' + e.message);
    backup[key] = { type: 'error', error: e.message };
  }
}

// Step 3: Write to file
const date = new Date().toISOString().split('T')[0];
const filename = 'redis-backup-' + date + '.json';
fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
const sizeKB = (fs.statSync(filename).size / 1024).toFixed(1);
console.log('\nBackup complete: ' + filename + ' (' + sizeKB + ' KB, ' + allKeys.length + ' keys)');
