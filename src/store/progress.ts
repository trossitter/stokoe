export type SignRecord = {
  attempts: number;
  passes: number;
  lastAttempt: number; // epoch ms
};

export type Progress = Record<string, SignRecord>;

export type UserProfile = {
  name: string;
  createdAt: number;
};

const PROFILE_KEY = "stokoe:profile";
const PROGRESS_KEY = "stokoe:progress";

export function getProfile(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile(name: string): UserProfile {
  const profile: UserProfile = { name, createdAt: Date.now() };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function getProgress(): Progress {
  const raw = localStorage.getItem(PROGRESS_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function recordAttempt(signId: string, passed: boolean): Progress {
  const progress = getProgress();
  const prev = progress[signId] ?? { attempts: 0, passes: 0, lastAttempt: 0 };
  progress[signId] = {
    attempts: prev.attempts + 1,
    passes: prev.passes + (passed ? 1 : 0),
    lastAttempt: Date.now(),
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return progress;
}

export function masteryLevel(record: SignRecord | undefined): "none" | "learning" | "mastered" {
  if (!record || record.attempts === 0) return "none";
  const rate = record.passes / record.attempts;
  if (record.passes >= 3 && rate >= 0.7) return "mastered";
  return "learning";
}
