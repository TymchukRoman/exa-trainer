export function parseDurationToMs(raw: string): number | null {
  const input = raw.trim().toLowerCase();
  if (!input) return null;

  const tokenRegex = /(\d+)\s*(h|m|s)/g;
  let totalMs = 0;
  let matched = false;
  let consumed = "";
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(input)) !== null) {
    matched = true;
    consumed += match[0];
    const value = Number(match[1]);
    const unit = match[2];
    if (unit === "h") totalMs += value * 60 * 60 * 1000;
    if (unit === "m") totalMs += value * 60 * 1000;
    if (unit === "s") totalMs += value * 1000;
  }

  if (!matched) return null;

  const normalizedInput = input.replace(/\s+/g, "");
  const normalizedConsumed = consumed.replace(/\s+/g, "");
  if (normalizedInput !== normalizedConsumed) return null;

  return totalMs > 0 ? totalMs : null;
}

export function formatDurationMs(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
}
