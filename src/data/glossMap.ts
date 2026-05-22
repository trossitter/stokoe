/**
 * Maps vocab item id → ASL Citizen gloss string used in training data.
 *
 * Most ids match the gloss directly (uppercased id = gloss).
 * Entries here are the exceptions: variant labels, substitutions, or
 * signs where the dataset gloss differs from the display word.
 *
 * Substitutions (sign not in ASL Citizen under expected gloss):
 *   five        → STOP       (FIVE absent; STOP is a distinct ASL-1 sign)
 *   ten         → HAPPY      (TEN absent; HAPPY is a distinct ASL-1 sign)
 *   tired       → TIRED      (replaces YOU'RE WELCOME, which is absent)
 *
 * Variant labels (same sign, different dataset labelling convention):
 *   goodbye     → BYE
 *   thank-you   → THANKYOU
 *   eat         → EAT1
 *   drink       → DRINK1
 *   what        → WHAT1
 *   how         → HOW1
 *   want        → WANT1
 *   baby        → BABY1
 *   i-me        → ME
 */
export const GLOSS_MAP: Record<string, string> = {
  "goodbye":    "BYE",
  "thank-you":  "THANKYOU",
  "eat":        "EAT1",
  "drink":      "DRINK1",
  "what":       "WHAT1",
  "how":        "HOW1",
  "want":       "WANT1",
  "baby":       "BABY1",
  "i-me":       "ME",
  "stop":       "STOP",
  "happy":      "HAPPY",
  "tired":      "TIRED",
};

/** Resolve a vocab id to its ASL Citizen gloss. Falls back to uppercased id. */
export function resolveGloss(vocabId: string): string {
  return GLOSS_MAP[vocabId] ?? vocabId.replace(/-/g, " ").toUpperCase();
}
