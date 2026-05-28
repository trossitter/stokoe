/**
 * Stokoe notation for each vocabulary sign.
 * Format: tab + dez(orientation) + sig  =  TDs
 *
 * ASCII-Stokoe encoding (Mandel 1993) — rendered by StokoeTempo font.
 * Reference: docs/stokoe_notation_reference.md
 *
 * tab symbols:  0=neutral-space  P=forehead  T=eyes/nose  U=chin/lips  }=cheek/temple
 *               [ ]=trunk/chest  Q=face  N=neck  J=elbow  9=wrist-sup  6=wrist-pron
 * dez symbols:  B=flat  5=spread  C=curved  G=index  X=hook  A=fist
 *               V=V-shape  L=L-shape  O=tapered-O  W=3-spread  Y=Y-shape
 *               H=2-flat  F=okay  8=bent-middle  3=3-finger
 * sig symbols:  Dx=contact  D@=circular  Dg=wrist-twist  Dv=down  D^=up
 *               Df=forward  Dt=toward  D>=rightward  D<=leftward  Dz=side-to-side
 *               D#=close-up
 *               D%=separate  D+=cross  De=wiggle  Dr=nod  Dw=up-down  Dm=to-fro
 * orientation:  fD=palm-away  tD=palm-toward  aD=palm-up  bD=palm-down
 *               ^D=fingers-up  >D=palm-dominant-side  vD=fingers-down
 * modifiers:    · after sig=repeated  ˙ above sig=sharp/single  ~ two-handed-sequential
 */
export type NotationEntry = {
  ascii: string;       // ASCII-Stokoe string (StokoeTempo font input)
  tab: string;         // location symbol (ASCII)
  dez: string;         // handshape symbol (ASCII)
  orientation: string; // orientation subscript (ASCII)
  sig: string;         // movement symbol (ASCII)
  readable: string;    // plain English description for hint fallback
  hands?: 1 | 2;        // minimum visible hands expected for structural validation
  requiredParameters?: Array<"tab" | "dez" | "sig">;
  tabSample?: "start" | "middle";
};

export const NOTATION: Record<string, NotationEntry> = {
  // ── Greetings & Social ────────────────────────────────────────────────────
  "hello": {
    ascii: "P5<Df",
    tab: "P", dez: "5", orientation: "<", sig: "Df",
    readable: "Open hand at temple, brush outward",
  },
  "goodbye": {
    ascii: "05fDg",
    tab: "0", dez: "5", orientation: "f", sig: "Dg",
    readable: "Open hand in neutral space, wrist wave",
  },
  "please": {
    ascii: "[ ]BtD@",
    tab: "[ ]", dez: "B", orientation: "t", sig: "D@",
    readable: "Flat hand on chest, circular movement",
  },
  "thank-you": {
    ascii: "UBaDf",
    tab: "U", dez: "B", orientation: "a", sig: "Df",
    readable: "Flat hand from chin, arc forward",
  },
  "sorry": {
    ascii: "[ ]AtD@",
    tab: "[ ]", dez: "A", orientation: "t", sig: "D@",
    readable: "Fist on chest, circular movement",
  },
  "yes": {
    ascii: "0AfDr",
    tab: "0", dez: "A", orientation: "f", sig: "Dr",
    readable: "Fist in neutral space, nod up-down",
  },
  "no": {
    ascii: "0HfD#",
    tab: "0", dez: "H", orientation: "f", sig: "D#",
    readable: "Two fingers in neutral space, snap closed",
    requiredParameters: ["dez", "sig"],
  },
  "bathroom": {
    ascii: "0AfDg",
    tab: "0", dez: "A", orientation: "f", sig: "Dg",
    readable: "T-hand in neutral space, side-to-side wrist shake",
  },
  "good": {
    ascii: "UBaDf",
    tab: "U", dez: "B", orientation: "a", sig: "Df",
    readable: "Flat hand from chin, arc to open palm",
    hands: 2,
  },
  "bad": {
    ascii: "UBtDb",
    tab: "U", dez: "B", orientation: "t", sig: "Db",
    readable: "Flat hand from chin, flip palm down",
  },
  "tired": {
    ascii: "[ ]5tDv",
    tab: "[ ]", dez: "5", orientation: "t", sig: "Dv",
    readable: "Bent hands on chest, drop downward",
    hands: 2,
  },

  // ── Numbers ───────────────────────────────────────────────────────────────
  "one": {
    ascii: "0GfD",
    tab: "0", dez: "G", orientation: "f", sig: "D",
    readable: "Index finger up in neutral space, static",
  },
  "two": {
    ascii: "0VfD",
    tab: "0", dez: "V", orientation: "f", sig: "D",
    readable: "Two fingers up in neutral space, static",
  },
  "three": {
    ascii: "03fD",
    tab: "0", dez: "3", orientation: "f", sig: "D",
    readable: "Three fingers up in neutral space, static",
  },
  "four": {
    ascii: "0WfD",
    tab: "0", dez: "W", orientation: "f", sig: "D",
    readable: "Four fingers up in neutral space, static",
  },
  "happy": {
    ascii: "[ ]BtD^",
    tab: "[ ]", dez: "B", orientation: "t", sig: "D^",
    readable: "Flat hand on chest, brush upward twice",
  },
  "six": {
    ascii: "0YfD",
    tab: "0", dez: "Y", orientation: "f", sig: "D",
    readable: "Pinky-thumb hand in neutral space, static",
  },
  "seven": {
    ascii: "08fD",
    tab: "0", dez: "8", orientation: "f", sig: "D",
    readable: "Bent-middle hand in neutral space, static",
  },
  "eight": {
    ascii: "0FfD",
    tab: "0", dez: "F", orientation: "f", sig: "D",
    readable: "F-hand in neutral space, static",
  },
  "nine": {
    ascii: "0FfDDx",
    tab: "0", dez: "F", orientation: "f", sig: "Dx",
    readable: "Index-thumb touch in neutral space, static",
  },

  // ── Colors ────────────────────────────────────────────────────────────────
  "red": {
    ascii: "UGtDw",
    tab: "U", dez: "G", orientation: "t", sig: "Dw",
    readable: "Index finger at lips, brush down twice",
  },
  "blue": {
    ascii: "0BfDg",
    tab: "0", dez: "B", orientation: "f", sig: "Dg",
    readable: "B-hand in neutral space, wrist twist",
  },
  "green": {
    ascii: "0GfDg",
    tab: "0", dez: "G", orientation: "f", sig: "Dg",
    readable: "G-hand in neutral space, wrist shake",
    requiredParameters: ["sig"],
  },
  "yellow": {
    ascii: "0YfDg",
    tab: "0", dez: "Y", orientation: "f", sig: "Dg",
    readable: "Y-hand in neutral space, wrist shake",
  },
  "orange": {
    ascii: "UC>D@",
    tab: "U", dez: "C", orientation: ">", sig: "D@",
    readable: "C-hand at chin, squeeze open-close",
  },
  "purple": {
    ascii: "0KfDg",
    tab: "0", dez: "K", orientation: "f", sig: "Dg",
    readable: "P-hand in neutral space, wrist shake",
  },
  "black": {
    ascii: "PGbD>",
    tab: "P", dez: "G", orientation: "b", sig: "D>",
    readable: "Index finger across forehead, outward drag",
  },
  "white": {
    ascii: "[ ]5tDf",
    tab: "[ ]", dez: "5", orientation: "t", sig: "Df",
    readable: "Open hand on chest, pull away closing",
  },

  // ── Family ────────────────────────────────────────────────────────────────
  "mother": {
    ascii: "U5>Dx",
    tab: "U", dez: "5", orientation: ">", sig: "Dx",
    readable: "Spread hand at chin, thumb taps twice",
  },
  "father": {
    ascii: "P5>Dx",
    tab: "P", dez: "5", orientation: ">", sig: "Dx",
    readable: "Spread hand at forehead, thumb taps twice",
  },
  "sister": {
    ascii: "UL>Df",
    tab: "U", dez: "L", orientation: ">", sig: "Df",
    readable: "L-hand from chin, arc down to other hand",
    hands: 2,
  },
  "brother": {
    ascii: "PL>Df",
    tab: "P", dez: "L", orientation: ">", sig: "Df",
    readable: "L-hand from forehead, arc down to other hand",
    hands: 2,
  },
  "baby": {
    ascii: "[ ]BaD<>",
    tab: "[ ]", dez: "B", orientation: "a", sig: "Dz",
    readable: "Crossed arms on chest, rock side to side",
    hands: 2,
  },
  "family": {
    ascii: "0FfD@",
    tab: "0", dez: "F", orientation: "f", sig: "D@",
    readable: "F-hands in neutral space, arc outward to circle",
    hands: 2,
  },

  // ── Common Verbs ──────────────────────────────────────────────────────────
  "eat": {
    ascii: "UOtDx",
    tab: "U", dez: "O", orientation: "t", sig: "Dx·",
    readable: "Flat-O to mouth, tap twice",
  },
  "drink": {
    ascii: "UCaDf",
    tab: "U", dez: "C", orientation: "a", sig: "Df",
    readable: "C-hand tilts to mouth",
  },
  "want": {
    ascii: "05aDt",
    tab: "0", dez: "5", orientation: "a", sig: "Dt",
    readable: "Claw hands in neutral, pull toward body",
    hands: 2,
  },
  "like": {
    ascii: "[ ]8tDf",
    tab: "[ ]", dez: "8", orientation: "t", sig: "Df",
    readable: "Middle-thumb pinch from chest, pull away",
  },
  "love": {
    ascii: "[ ]AtD",
    tab: "[ ]", dez: "A", orientation: "t", sig: "D",
    readable: "Crossed arms on chest, static",
    hands: 2,
  },
  "help": {
    ascii: "0BaD^",
    tab: "0", dez: "B", orientation: "a", sig: "D^",
    readable: "Flat palm lifts fist upward",
    hands: 2,
  },
  "know": {
    ascii: "}BtDx",
    tab: "}", dez: "B", orientation: "t", sig: "Dx",
    readable: "Bent hand taps temple",
  },
  "understand": {
    ascii: "}AfD^",
    tab: "}", dez: "A", orientation: "f", sig: "D^",
    readable: "Fist at temple, index flicks up",
  },
  "go": {
    ascii: "0GfDf",
    tab: "0", dez: "G", orientation: "f", sig: "Df",
    readable: "Both index fingers arc outward",
    hands: 2,
  },
  "come": {
    ascii: "0GfDt",
    tab: "0", dez: "G", orientation: "f", sig: "Dt",
    readable: "Both index fingers arc inward",
    hands: 2,
  },
  "see": {
    ascii: "TVbDf",
    tab: "T", dez: "V", orientation: "b", sig: "Df",
    readable: "V-hand from eyes, moves forward",
    requiredParameters: ["tab", "sig"],
    tabSample: "start",
  },
  "learn": {
    ascii: "POaDt",
    tab: "P", dez: "O", orientation: "a", sig: "Dt",
    readable: "Flat-O picks from palm, brings to forehead",
    hands: 2,
  },
  "sleep": {
    ascii: "Q5tDv",
    tab: "Q", dez: "5", orientation: "t", sig: "Dv",
    readable: "Open hand over face, draw down closing",
  },

  // ── Pronouns ──────────────────────────────────────────────────────────────
  "i-me": {
    ascii: "[ ]GtDx",
    tab: "[ ]", dez: "G", orientation: "t", sig: "Dx",
    readable: "Index finger points to own chest",
  },
  "you": {
    ascii: "0GfDf",
    tab: "0", dez: "G", orientation: "f", sig: "Df",
    readable: "Index finger points forward",
  },

  // ── Nouns ─────────────────────────────────────────────────────────────────
  "water": {
    ascii: "UWfDx",
    tab: "U", dez: "W", orientation: "f", sig: "Dx·",
    readable: "W-hand taps chin twice",
  },
  "home": {
    ascii: "}OtDx",
    tab: "}", dez: "O", orientation: "t", sig: "Dx·",
    readable: "Flat-O taps cheek near mouth then near ear",
  },
  "school": {
    ascii: "[ ]BbDx",
    tab: "[ ]", dez: "B", orientation: "b", sig: "Dx·",
    readable: "Flat hand claps down on other palm twice",
    hands: 2,
  },
  "book": {
    ascii: "0BaD%",
    tab: "0", dez: "B", orientation: "a", sig: "D%",
    readable: "Two flat palms open like a book",
    hands: 2,
  },
  "name": {
    ascii: "0HbD+",
    tab: "0", dez: "H", orientation: "b", sig: "D+",
    readable: "H-hand crosses over other H-hand",
    hands: 2,
  },

  // ── Questions ─────────────────────────────────────────────────────────────
  "what": {
    ascii: "05aDz",
    tab: "0", dez: "5", orientation: "a", sig: "Dz",
    readable: "Open hands in neutral space, shake side to side",
    hands: 2,
  },
  "where": {
    ascii: "0G^Dz",
    tab: "0", dez: "G", orientation: "^", sig: "Dz",
    readable: "Index finger wags side to side",
  },
  "who": {
    ascii: "ULtD@",
    tab: "U", dez: "L", orientation: "t", sig: "D@",
    readable: "Index traces circle around lips",
  },
  "how": {
    ascii: "0BbD^",
    tab: "0", dez: "B", orientation: "b", sig: "D^",
    readable: "Bent hands knuckles-together, roll upward",
    hands: 2,
  },
  "why": {
    ascii: "PBtDf",
    tab: "P", dez: "B", orientation: "t", sig: "Df",
    readable: "Bent hand touches forehead, middle finger extends outward",
  },

  // ── Descriptors ───────────────────────────────────────────────────────────
  "big": {
    ascii: "0L>D%",
    tab: "0", dez: "L", orientation: ">", sig: "D%",
    readable: "Both L-hands move apart (showing size)",
    hands: 2,
  },
  "small": {
    ascii: "0BfD%",
    tab: "0", dez: "B", orientation: "f", sig: "Dt",
    readable: "Flat hands come close together",
    hands: 2,
  },
  "hot": {
    ascii: "UCfDg",
    tab: "U", dez: "C", orientation: "f", sig: "Dg",
    readable: "Claw hand at mouth, twist outward",
  },
  "cold": {
    ascii: "0AfDg",
    tab: "0", dez: "A", orientation: "f", sig: "Dg",
    readable: "Both fists near shoulders, shiver",
    hands: 2,
  },
  "stop": {
    ascii: "[ ]BbDx",
    tab: "[ ]", dez: "B", orientation: "b", sig: "Dx",
    readable: "Flat hand chops down onto open palm",
    hands: 2,
  },
};
