import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getProfile,
  saveProfile,
  markTutorialDone,
  getProgress,
  recordAttempt,
  masteryLevel,
} from "./progress";

const store: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
});

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
});

describe("getProfile", () => {
  it("returns null when localStorage is empty", () => {
    expect(getProfile()).toBeNull();
  });

  it("returns parsed profile when key exists", () => {
    const profile = {
      name: "Asha",
      createdAt: 1000,
      powerUser: false,
      tutorialDone: false,
    };
    store["stokoe:profile"] = JSON.stringify(profile);
    expect(getProfile()).toEqual(profile);
  });
});

describe("saveProfile", () => {
  it("returns a profile with correct name, powerUser=false, tutorialDone=false", () => {
    const profile = saveProfile("Asha", false);
    expect(profile.name).toBe("Asha");
    expect(profile.powerUser).toBe(false);
    expect(profile.tutorialDone).toBe(false);
  });

  it("power user has tutorialDone=true", () => {
    const profile = saveProfile("Dev", true);
    expect(profile.powerUser).toBe(true);
    expect(profile.tutorialDone).toBe(true);
  });

  it("persists to localStorage", () => {
    saveProfile("Asha", false);
    const raw = store["stokoe:profile"];
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw);
    expect(parsed.name).toBe("Asha");
  });
});

describe("markTutorialDone", () => {
  it("sets tutorialDone=true on the profile", () => {
    const profile = saveProfile("Asha", false);
    expect(profile.tutorialDone).toBe(false);
    const updated = markTutorialDone(profile);
    expect(updated.tutorialDone).toBe(true);
  });

  it("preserves all other fields", () => {
    const profile = saveProfile("Asha", false);
    const updated = markTutorialDone(profile);
    expect(updated.name).toBe(profile.name);
    expect(updated.powerUser).toBe(profile.powerUser);
    expect(updated.createdAt).toBe(profile.createdAt);
  });

  it("persists to localStorage", () => {
    const profile = saveProfile("Asha", false);
    markTutorialDone(profile);
    const raw = store["stokoe:profile"];
    expect(JSON.parse(raw).tutorialDone).toBe(true);
  });
});

describe("getProgress", () => {
  it("returns empty object when no data", () => {
    expect(getProgress()).toEqual({});
  });

  it("returns parsed progress when data exists", () => {
    const progress = {
      hello: { attempts: 3, passes: 2, lastAttempt: 9999 },
    };
    store["stokoe:progress"] = JSON.stringify(progress);
    expect(getProgress()).toEqual(progress);
  });
});

describe("recordAttempt", () => {
  it("creates a new record on first attempt (pass)", () => {
    const progress = recordAttempt("hello", true);
    expect(progress["hello"]).toEqual(
      expect.objectContaining({ attempts: 1, passes: 1 }),
    );
  });

  it("creates a new record on first attempt (fail)", () => {
    const progress = recordAttempt("hello", false);
    expect(progress["hello"]).toEqual(
      expect.objectContaining({ attempts: 1, passes: 0 }),
    );
  });

  it("increments attempts and passes correctly on subsequent calls", () => {
    recordAttempt("hello", true);
    recordAttempt("hello", false);
    recordAttempt("hello", true);
    const progress = getProgress();
    expect(progress["hello"].attempts).toBe(3);
    expect(progress["hello"].passes).toBe(2);
  });

  it("lastAttempt is a recent timestamp", () => {
    const before = Date.now();
    const progress = recordAttempt("hello", true);
    const after = Date.now();
    expect(progress["hello"].lastAttempt).toBeGreaterThanOrEqual(before);
    expect(progress["hello"].lastAttempt).toBeLessThanOrEqual(after);
  });
});

describe("masteryLevel", () => {
  it("returns 'none' for undefined record", () => {
    expect(masteryLevel(undefined)).toBe("none");
  });

  it("returns 'none' for 0 attempts", () => {
    expect(masteryLevel({ attempts: 0, passes: 0, lastAttempt: 0 })).toBe(
      "none",
    );
  });

  it("returns 'learning' for a record with attempts but below mastery threshold", () => {
    expect(masteryLevel({ attempts: 5, passes: 2, lastAttempt: 0 })).toBe(
      "learning",
    );
  });

  it("returns 'mastered' for 3+ passes at 70%+ pass rate", () => {
    expect(masteryLevel({ attempts: 4, passes: 3, lastAttempt: 0 })).toBe(
      "mastered",
    );
  });

  it("returns 'learning' for 3 passes but only 60% rate (5 total attempts)", () => {
    expect(masteryLevel({ attempts: 5, passes: 3, lastAttempt: 0 })).toBe(
      "learning",
    );
  });

  it("returns 'learning' for 70%+ rate but fewer than 3 passes (e.g. 1/1)", () => {
    expect(masteryLevel({ attempts: 1, passes: 1, lastAttempt: 0 })).toBe(
      "learning",
    );
  });
});
