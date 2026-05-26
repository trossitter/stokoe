export type NarrativeEntryStatus = "verified" | "constructed" | "sourced";

export type NarrativeEntry = {
  beat: string;
  gloss: string;
  status: NarrativeEntryStatus;
  notationId?: string;
  ascii?: string;
  description: string;
};

export type NarrativePassage = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  entries: NarrativeEntry[];
};

export const NARRATIVE_PASSAGES: NarrativePassage[] = [
  {
    id: "goldilocks",
    title: "Goldilocks & the Three Bears",
    subtitle: "Sourced corpus passage",
    summary: "A story begins with three bears, deep woods, a house, and a book to read.",
    entries: [
      {
        beat: "1",
        gloss: "STORY",
        status: "sourced",
        ascii: "BɑBɑz~",
        description: "Neutral space, bilateral flat-B handshape, wrist-oscillate.",
      },
      {
        beat: "2",
        gloss: "THREE BEARS",
        status: "sourced",
        ascii: "[]√C‡√Cv ×•",
        description: "Bilateral curved-C handshape, contact, repeated.",
      },
      {
        beat: "3",
        gloss: "DEEP WOODS",
        status: "sourced",
        ascii: "Bɑ√Bʌω",
        description: "Neutral to upper space, flat-B handshape, loose-wiggle.",
      },
      {
        beat: "4",
        gloss: "HOUSE",
        status: "sourced",
        ascii: "BʌˡBʌ÷",
        description: "Upper space, bilateral B-hands, repeated contact.",
      },
      {
        beat: "5",
        gloss: "READ",
        status: "sourced",
        ascii: "B⊤Vɒv•",
        description: "Overhead, V-hand over flat palm, downward brush.",
      },
    ],
  },
  {
    id: "red-riding-hood",
    title: "Little Red Riding Hood",
    subtitle: "Draft narrative study",
    summary: "A mother sends a child in a red cloak through the forest. A wolf appears; she calls for help.",
    entries: [
      {
        beat: "1",
        gloss: "MOTHER",
        status: "verified",
        notationId: "mother",
        description: "Pulled from the app's verified training vocabulary.",
      },
      {
        beat: "1",
        gloss: "SEND / GIVE",
        status: "constructed",
        ascii: "0BaDf",
        description: "Neutral-space flat hand moving forward, used here as a transfer or send connector.",
      },
      {
        beat: "2",
        gloss: "RED",
        status: "verified",
        notationId: "red",
        description: "Pulled from the app's verified training vocabulary.",
      },
      {
        beat: "2",
        gloss: "CLOAK / WEAR",
        status: "constructed",
        ascii: "[ ]B>Dx",
        description: "Torso location with flat hand contact, used as a compact clothing/shoulder cue.",
      },
      {
        beat: "3",
        gloss: "FOREST / TREES",
        status: "constructed",
        ascii: "05^Dz~",
        description: "Open spread hands in neutral space, fingers up, alternating side motion.",
      },
      {
        beat: "4",
        gloss: "WOLF",
        status: "constructed",
        ascii: "}5tDx",
        description: "Spread/claw handshape at the side of the face with contact.",
      },
      {
        beat: "4",
        gloss: "BIG",
        status: "verified",
        notationId: "big",
        description: "Pulled from the app's verified training vocabulary.",
      },
      {
        beat: "5",
        gloss: "HELP",
        status: "verified",
        notationId: "help",
        description: "Pulled from the app's verified training vocabulary.",
      },
      {
        beat: "5",
        gloss: "COME",
        status: "verified",
        notationId: "come",
        description: "Pulled from the app's verified training vocabulary.",
      },
    ],
  },
  {
    id: "cinderella",
    title: "Cinderella",
    subtitle: "Draft narrative study",
    summary: "She works all day, goes to a dance, loses a small slipper, and the night changes everything.",
    entries: [
      {
        beat: "1",
        gloss: "WORK / ALL-DAY",
        status: "constructed",
        ascii: "0AfDx",
        description: "Neutral-space fist handshape with contact, compressed here for repeated labor.",
      },
      {
        beat: "1",
        gloss: "TIRED",
        status: "verified",
        notationId: "tired",
        description: "Pulled from the app's verified training vocabulary.",
      },
      {
        beat: "2",
        gloss: "GO",
        status: "verified",
        notationId: "go",
        description: "Pulled from the app's verified training vocabulary.",
      },
      {
        beat: "2",
        gloss: "DANCE",
        status: "constructed",
        ascii: "0VbDz~",
        description: "V-hand in neutral space with alternating side motion, used as a compact dance cue.",
      },
      {
        beat: "3",
        gloss: "PRINCE",
        status: "constructed",
        ascii: "PBfDf",
        description: "Forehead start with flat hand moving outward, used as a draft royalty cue.",
      },
      {
        beat: "3",
        gloss: "SEE",
        status: "verified",
        notationId: "see",
        description: "Pulled from the app's verified training vocabulary.",
      },
      {
        beat: "3",
        gloss: "SHOE / SLIPPER",
        status: "constructed",
        ascii: "0AaDx",
        description: "Neutral-space fist handshapes with contact, modeled after the common shoe tap.",
      },
      {
        beat: "3",
        gloss: "SMALL",
        status: "verified",
        notationId: "small",
        description: "Pulled from the app's verified training vocabulary.",
      },
      {
        beat: "4",
        gloss: "NIGHT / MIDNIGHT",
        status: "constructed",
        ascii: "0BbDv",
        description: "Neutral-space flat hand, palm down, arcing downward for nightfall.",
      },
      {
        beat: "5",
        gloss: "HAPPY",
        status: "verified",
        notationId: "happy",
        description: "Pulled from the app's verified training vocabulary.",
      },
    ],
  },
];
