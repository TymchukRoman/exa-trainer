const STORAGE_KEY = "exa-trainer-training-session";

export type TrainingSessionStore = {
  date: string;
  exerciseLabels: string[];
};

function readRaw(): TrainingSessionStore | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrainingSessionStore;
    if (!parsed.date || !Array.isArray(parsed.exerciseLabels)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function write(store: TrainingSessionStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function clearIfStale(today: string): void {
  const stored = readRaw();
  if (stored && stored.date !== today) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function readTrainingSession(today: string): TrainingSessionStore {
  clearIfStale(today);
  const stored = readRaw();
  if (!stored || stored.date !== today) {
    return { date: today, exerciseLabels: [] };
  }
  return stored;
}

export function addExerciseToSession(label: string, today: string): void {
  const trimmed = label.trim();
  if (!trimmed) return;

  const session = readTrainingSession(today);
  const lower = trimmed.toLowerCase();
  if (session.exerciseLabels.some((item) => item.toLowerCase() === lower)) {
    return;
  }

  write({
    date: today,
    exerciseLabels: [...session.exerciseLabels, trimmed],
  });
}

export function removeExerciseFromSession(label: string, today: string): void {
  const trimmed = label.trim();
  if (!trimmed) return;

  const session = readTrainingSession(today);
  const lower = trimmed.toLowerCase();
  write({
    date: today,
    exerciseLabels: session.exerciseLabels.filter((item) => item.toLowerCase() !== lower),
  });
}
