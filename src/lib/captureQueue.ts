import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CaptureLocation } from './location';

/** A capture taken while offline, waiting to be turned into a card. */
export interface QueuedCapture {
  id: string;
  photoBase64: string;
  source: 'object' | 'library' | 'ocr';
  selfieBase64?: string | null;
  note?: string | null;
  location?: CaptureLocation | null;
  targetLanguage: string;
  nativeLanguage: string;
  createdAt: string;
}

const KEY = 'lexilog.captureQueue.v1';

async function readAll(): Promise<QueuedCapture[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedCapture[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(items: QueuedCapture[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function enqueueCapture(item: QueuedCapture): Promise<void> {
  const items = await readAll();
  items.push(item);
  await writeAll(items);
}

export async function getQueue(): Promise<QueuedCapture[]> {
  return readAll();
}

export async function removeFromQueue(id: string): Promise<void> {
  const items = await readAll();
  await writeAll(items.filter((i) => i.id !== id));
}
