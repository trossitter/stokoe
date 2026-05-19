// TODO: expand to the full 75-100 ASL 1 beginner vocabulary list.
// Picked an obvious starter set so the prompt component has something to point at.
export type VocabItem = {
  id: string;
  word: string;
  // Optional teaching notes used to seed targeted hints (Requirement 10).
  hints?: Partial<{
    handshape: string;
    movement: string;
    location: string;
    orientation: string;
  }>;
};

export const STARTER_VOCAB: VocabItem[] = [
  { id: "hello", word: "HELLO" },
  { id: "thank-you", word: "THANK YOU" },
  { id: "please", word: "PLEASE" },
  { id: "yes", word: "YES" },
  { id: "no", word: "NO" },
];
