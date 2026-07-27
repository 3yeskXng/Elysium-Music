// src/components/lyrics/services/lrcParser.ts
// Pure LRC format parser — converts raw LRC text into structured timed lyric lines

export interface LyricLine {
  time: number;
  text: string;
}

export interface ParsedLyrics {
  metadata: { title?: string; artist?: string; album?: string };
  lines: LyricLine[];
}

const TIME_REGEX = /\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\]/g;
const META_REGEX = /\[(ti|ar|al):(.+)\]/;

function parseTimestamp(min: string, sec: string, ms?: string): number {
  const minutes = parseInt(min, 10);
  const seconds = parseInt(sec, 10);
  let millis = 0;
  if (ms) {
    millis = ms.length === 2 ? parseInt(ms, 10) * 10 : parseInt(ms, 10);
  }
  return minutes * 60 + seconds + millis / 1000;
}

export function parseLrc(content: string): ParsedLyrics {
  const result: ParsedLyrics = { metadata: {}, lines: [] };
  const seenTimestamps = new Set<number>();

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    const metaMatch = line.match(META_REGEX);
    if (metaMatch) {
      const [, key, value] = metaMatch;
      if (key === 'ti') result.metadata.title = value.trim();
      if (key === 'ar') result.metadata.artist = value.trim();
      if (key === 'al') result.metadata.album = value.trim();
      continue;
    }

    const timestamps: number[] = [];
    let match: RegExpExecArray | null;

    TIME_REGEX.lastIndex = 0;
    while ((match = TIME_REGEX.exec(line)) !== null) {
      timestamps.push(parseTimestamp(match[1], match[2], match[3]));
    }

    if (timestamps.length === 0) continue;

    const text = line.replace(/\[\d{1,2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();

    for (const time of timestamps) {
      const key = Math.round(time * 1000);
      if (seenTimestamps.has(key)) continue;
      seenTimestamps.add(key);
      result.lines.push({ time, text });
    }
  }

  result.lines.sort((a, b) => a.time - b.time);
  return result;
}

export function findActiveLine(lines: LyricLine[], currentTime: number): number {
  if (lines.length === 0) return -1;

  let low = 0;
  let high = lines.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    if (lines[mid].time <= currentTime) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return high;
}

export function formatLrcTime(seconds: number): string {
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  const ms = Math.floor((seconds % 1) * 100).toString().padStart(2, '0');
  return `${min}:${sec}.${ms}`;
}
