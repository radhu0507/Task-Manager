import { mkdirSync } from 'fs';
import path from 'path';
import { config } from '../config';

export function ensureUploadDir() {
  const dir = path.resolve(config.uploadDir);
  mkdirSync(dir, { recursive: true });
  return dir;
}