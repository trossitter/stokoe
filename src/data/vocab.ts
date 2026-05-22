export type StokoeParams = {
  handshape: string;
  movement: string;
  location: string;
  orientation: string;
};

export type VocabItem = {
  id: string;
  word: string;
  params: StokoeParams;
  hints: StokoeParams & { framing: string };
};

export const VOCAB: VocabItem[] = [
  // ── Greetings & Social ──────────────────────────────────────────────────
  {
    id: "hello",
    word: "HELLO",
    params: {
      handshape: "Open-5 (all fingers extended, spread)",
      movement: "Single outward brush from temple",
      location: "Temple / side of forehead",
      orientation: "Palm facing outward",
    },
    hints: {
      handshape: "Open all five fingers wide — like you're waving, not pointing.",
      movement: "One smooth brush outward from your temple. Not a wave; one motion.",
      location: "Start at your temple, not your cheek or forehead center.",
      orientation: "Turn your palm to face outward, away from you.",
      framing: "Make sure your hand is visible inside the guide box.",
    },
  },
  {
    id: "goodbye",
    word: "GOODBYE",
    params: {
      handshape: "Open-5 (fingers extended)",
      movement: "Fingers fold down and open repeatedly (wave)",
      location: "Neutral space, shoulder height",
      orientation: "Palm facing outward",
    },
    hints: {
      handshape: "Open all five fingers before you wave.",
      movement: "Fold your fingers down toward your palm, then reopen — like a classic wave.",
      location: "Keep your hand at shoulder height in front of you.",
      orientation: "Palm should face the person you're signing to.",
      framing: "Make sure your waving hand is fully inside the guide box.",
    },
  },
  {
    id: "please",
    word: "PLEASE",
    params: {
      handshape: "Flat-B (fingers together, extended)",
      movement: "Circular motion on chest",
      location: "Center chest",
      orientation: "Palm facing chest",
    },
    hints: {
      handshape: "Keep all fingers flat and together — no gaps between them.",
      movement: "Make a full circle on your chest. Don't just rub back and forth.",
      location: "Sign is centered on your chest, not your stomach or shoulder.",
      orientation: "Palm must face your own chest throughout the circle.",
      framing: "Keep your hand visible in the guide box — step back if needed.",
    },
  },
  {
    id: "thank-you",
    word: "THANK YOU",
    params: {
      handshape: "Flat-B (fingers together)",
      movement: "Touch chin, move outward and slightly down",
      location: "Chin → neutral space",
      orientation: "Palm facing upward, then rotating out",
    },
    hints: {
      handshape: "Flat hand, all fingers together. Like a salute starting point.",
      movement: "Touch your chin first, then move your hand outward and slightly down — as if offering something.",
      location: "Start at your chin, not your lips or cheek.",
      orientation: "Palm faces up when you touch your chin, rotating outward as you move.",
      framing: "Make sure both your chin contact and the outward arc are inside the guide box.",
    },
  },
  {
    id: "sorry",
    word: "SORRY",
    params: {
      handshape: "S-hand (closed fist, thumb alongside fingers)",
      movement: "Circular motion on chest",
      location: "Center chest",
      orientation: "Fist facing chest",
    },
    hints: {
      handshape: "Make a fist — the ASL 'S' handshape. Thumb alongside your fingers, not tucked inside.",
      movement: "Full circular motion on your chest. Not a pat — a circle.",
      location: "Centered on your chest. Same location as PLEASE but different handshape.",
      orientation: "The face of your fist should face your chest.",
      framing: "Keep your signing hand fully inside the guide box.",
    },
  },
  {
    id: "tired",
    word: "TIRED",
    params: {
      handshape: "Bent-5 (both hands, fingers bent, fingertips touching chest)",
      movement: "Elbows drop, hands rotate downward as if wilting",
      location: "Chest",
      orientation: "Palms facing body, rotating to face up",
    },
    hints: {
      handshape: "Both hands bent, fingertips touching your chest.",
      movement: "Let your elbows drop and hands rotate downward — like you're too tired to hold them up.",
      location: "Starts at your chest.",
      orientation: "Palms begin facing your body, rotate to face upward as hands drop.",
      framing: "Both hands should be inside the guide box.",
    },
  },
  {
    id: "yes",
    word: "YES",
    params: {
      handshape: "S-hand (closed fist)",
      movement: "Nod fist up and down (twice)",
      location: "Neutral space, chest height",
      orientation: "Fist pointing forward",
    },
    hints: {
      handshape: "Closed fist — like you're holding something small.",
      movement: "Nod the fist up and down twice, like a head nodding yes.",
      location: "Neutral space in front of your chest.",
      orientation: "Fist should point forward, not to the side.",
      framing: "Keep the fist movement inside the guide box.",
    },
  },
  {
    id: "no",
    word: "NO",
    params: {
      handshape: "Index and middle fingers extended (U-hand)",
      movement: "Fingers snap closed to thumb twice",
      location: "Neutral space, chest height",
      orientation: "Fingers pointing forward",
    },
    hints: {
      handshape: "Extend only your index and middle fingers, keeping others tucked.",
      movement: "Snap those two fingers down to meet your thumb — twice, quickly.",
      location: "In front of you at chest height.",
      orientation: "Point the fingers forward before snapping.",
      framing: "The finger snap should be visible inside the guide box.",
    },
  },
  {
    id: "good",
    word: "GOOD",
    params: {
      handshape: "Flat-B (fingers together)",
      movement: "Touch chin, arc forward and land on flat left palm",
      location: "Chin → neutral space",
      orientation: "Palm facing up",
    },
    hints: {
      handshape: "Flat hand, all fingers together.",
      movement: "Touch chin, then arc forward to land palm-up on your other flat hand.",
      location: "Start at chin, end in front at waist height.",
      orientation: "Palm faces up the entire motion.",
      framing: "Both the chin touch and landing position should be in the guide box.",
    },
  },
  {
    id: "bad",
    word: "BAD",
    params: {
      handshape: "Flat-B (fingers together)",
      movement: "Touch chin, flip hand outward and down (palm turns down)",
      location: "Chin → neutral space",
      orientation: "Starts palm-up, ends palm-down",
    },
    hints: {
      handshape: "Flat hand like GOOD, but the flip is the distinguishing motion.",
      movement: "Touch chin, then twist and flip outward — ending palm-down. The flip is critical.",
      location: "Start at chin, flip outward in front of you.",
      orientation: "Starts palm facing up at chin, ends palm facing down.",
      framing: "The full flip arc should be inside the guide box.",
    },
  },

  // ── Numbers ─────────────────────────────────────────────────────────────
  {
    id: "one",
    word: "ONE",
    params: {
      handshape: "Index finger extended (1-hand), others tucked",
      movement: "Static hold",
      location: "Neutral space, shoulder height",
      orientation: "Palm facing forward",
    },
    hints: {
      handshape: "Only your index finger extended — all other fingers tucked into your palm.",
      movement: "Hold still. No movement needed for static number signs.",
      location: "Hold in front of you at roughly shoulder height.",
      orientation: "Palm faces outward, away from you.",
      framing: "Keep your hand centered in the guide box.",
    },
  },
  {
    id: "two",
    word: "TWO",
    params: {
      handshape: "Index and middle fingers extended (V-hand / 2-hand)",
      movement: "Static hold",
      location: "Neutral space",
      orientation: "Palm facing forward",
    },
    hints: {
      handshape: "Index and middle fingers extended, others tucked. Like a V or peace sign.",
      movement: "Hold still.",
      location: "Neutral space in front of you.",
      orientation: "Palm facing outward.",
      framing: "Keep hand inside the guide box.",
    },
  },
  {
    id: "three",
    word: "THREE",
    params: {
      handshape: "Thumb, index, middle extended (3-hand)",
      movement: "Static hold",
      location: "Neutral space",
      orientation: "Palm facing forward",
    },
    hints: {
      handshape: "Thumb, index finger, and middle finger extended — other two fingers tucked.",
      movement: "Hold still.",
      location: "Neutral space in front of you.",
      orientation: "Palm facing outward.",
      framing: "Keep hand inside the guide box.",
    },
  },
  {
    id: "four",
    word: "FOUR",
    params: {
      handshape: "Four fingers extended, thumb tucked (4-hand)",
      movement: "Static hold",
      location: "Neutral space",
      orientation: "Palm facing forward",
    },
    hints: {
      handshape: "Extend all four fingers, tuck your thumb across your palm.",
      movement: "Hold still.",
      location: "Neutral space in front of you.",
      orientation: "Palm facing outward.",
      framing: "Keep hand inside the guide box.",
    },
  },
  {
    id: "stop",
    word: "STOP",
    params: {
      handshape: "Dominant flat-B chops onto non-dominant flat-B palm",
      movement: "Single downward chop onto stationary palm",
      location: "Neutral space, waist-chest height",
      orientation: "Dominant palm faces sideways; non-dominant palm faces up",
    },
    hints: {
      handshape: "Both hands flat. One is a stationary platform, one chops down onto it.",
      movement: "One firm chop — not a pat, a chop. Single motion.",
      location: "In front of you at about waist-chest height.",
      orientation: "The chopping hand comes in from the side, not straight down.",
      framing: "Both hands must be inside the guide box.",
    },
  },
  {
    id: "six",
    word: "SIX",
    params: {
      handshape: "Pinky and thumb touching, other three extended (6-hand)",
      movement: "Static hold",
      location: "Neutral space",
      orientation: "Palm facing forward",
    },
    hints: {
      handshape: "Touch pinky to thumb tip; extend index, middle, ring fingers.",
      movement: "Hold still.",
      location: "Neutral space.",
      orientation: "Palm facing outward.",
      framing: "Keep hand inside guide box.",
    },
  },
  {
    id: "seven",
    word: "SEVEN",
    params: {
      handshape: "Ring finger and thumb touching, others extended (7-hand)",
      movement: "Static hold",
      location: "Neutral space",
      orientation: "Palm facing forward",
    },
    hints: {
      handshape: "Touch ring finger to thumb; extend index, middle, pinky.",
      movement: "Hold still.",
      location: "Neutral space.",
      orientation: "Palm facing outward.",
      framing: "Keep hand inside guide box.",
    },
  },
  {
    id: "eight",
    word: "EIGHT",
    params: {
      handshape: "Middle finger and thumb touching, others extended (8-hand)",
      movement: "Static hold",
      location: "Neutral space",
      orientation: "Palm facing forward",
    },
    hints: {
      handshape: "Touch middle finger to thumb; extend index, ring, pinky.",
      movement: "Hold still.",
      location: "Neutral space.",
      orientation: "Palm facing outward.",
      framing: "Keep hand inside guide box.",
    },
  },
  {
    id: "nine",
    word: "NINE",
    params: {
      handshape: "Index finger and thumb touching (F/O-hand for 9), others extended",
      movement: "Static hold",
      location: "Neutral space",
      orientation: "Palm facing forward",
    },
    hints: {
      handshape: "Touch index finger to thumb, extend middle, ring, pinky fingers.",
      movement: "Hold still.",
      location: "Neutral space.",
      orientation: "Palm facing outward.",
      framing: "Keep hand inside guide box.",
    },
  },
  {
    id: "happy",
    word: "HAPPY",
    params: {
      handshape: "Flat-B (fingers together)",
      movement: "Two upward brushing strokes on chest",
      location: "Chest",
      orientation: "Palm facing chest, brushing upward",
    },
    hints: {
      handshape: "Flat hand, all fingers together.",
      movement: "Brush upward on your chest twice. Up, up — like happiness rising.",
      location: "Centered on your chest.",
      orientation: "Palm faces your chest throughout.",
      framing: "Keep your chest and hand inside the guide box.",
    },
  },

  // ── Colors ───────────────────────────────────────────────────────────────
  {
    id: "red",
    word: "RED",
    params: {
      handshape: "1-hand (index extended), then brushes down lip",
      movement: "Index finger brushes down across lips twice",
      location: "Lips",
      orientation: "Palm facing self",
    },
    hints: {
      handshape: "Just your index finger extended.",
      movement: "Brush down across your lips twice — short, quick strokes.",
      location: "Sign is at your lips, not your chin.",
      orientation: "Palm faces toward you.",
      framing: "Keep your mouth and hand inside the guide box.",
    },
  },
  {
    id: "blue",
    word: "BLUE",
    params: {
      handshape: "B-hand (fingers together, extended, thumb tucked)",
      movement: "Twist/shake wrist side to side",
      location: "Neutral space",
      orientation: "Palm facing forward, fingers pointing up",
    },
    hints: {
      handshape: "Fingers flat together, thumb tucked — the B handshape.",
      movement: "Shake or twist your wrist back and forth.",
      location: "Neutral space in front of you.",
      orientation: "Fingers pointing upward, palm forward.",
      framing: "Keep hand inside guide box.",
    },
  },
  {
    id: "green",
    word: "GREEN",
    params: {
      handshape: "G-hand (index and thumb extended, parallel)",
      movement: "Shake/twist wrist side to side",
      location: "Neutral space",
      orientation: "Palm facing left (dominant side)",
    },
    hints: {
      handshape: "Index finger and thumb extended parallel to each other — G handshape.",
      movement: "Shake the wrist side to side a couple of times.",
      location: "Neutral space in front of you.",
      orientation: "Index and thumb point sideways, not up.",
      framing: "Keep hand inside guide box.",
    },
  },
  {
    id: "yellow",
    word: "YELLOW",
    params: {
      handshape: "Y-hand (thumb and pinky extended)",
      movement: "Shake/twist wrist side to side",
      location: "Neutral space",
      orientation: "Palm facing self or sideways",
    },
    hints: {
      handshape: "Thumb and pinky extended, middle three fingers tucked — the Y handshape.",
      movement: "Shake the wrist side to side.",
      location: "Neutral space in front of you.",
      orientation: "Can face inward or to the side.",
      framing: "Keep hand inside guide box.",
    },
  },
  {
    id: "orange",
    word: "ORANGE",
    params: {
      handshape: "C-hand (curved, like holding a ball)",
      movement: "Open and close hand repeatedly near chin (squeezing motion)",
      location: "In front of chin",
      orientation: "Palm facing left (or toward dominant side)",
    },
    hints: {
      handshape: "Curve your hand like you're squeezing a orange — C shape.",
      movement: "Open and squeeze closed repeatedly, 2–3 times.",
      location: "In front of your chin, not your chest.",
      orientation: "Palm faces sideways, not forward.",
      framing: "Keep your chin and hand in frame.",
    },
  },
  {
    id: "purple",
    word: "PURPLE",
    params: {
      handshape: "P-hand (middle finger bent down, index and thumb extended)",
      movement: "Shake/twist wrist side to side",
      location: "Neutral space",
      orientation: "Palm facing down slightly",
    },
    hints: {
      handshape: "P handshape: middle finger points down, index extends forward, thumb out.",
      movement: "Shake the wrist side to side.",
      location: "Neutral space.",
      orientation: "Middle finger angles downward.",
      framing: "Keep hand inside guide box.",
    },
  },
  {
    id: "black",
    word: "BLACK",
    params: {
      handshape: "1-hand (index extended)",
      movement: "Index finger brushes across forehead from center outward",
      location: "Forehead",
      orientation: "Palm facing down",
    },
    hints: {
      handshape: "Just your index finger extended.",
      movement: "Draw your index finger across your forehead from center to side, once.",
      location: "Forehead — higher than eye level.",
      orientation: "Palm faces downward as you drag across.",
      framing: "Your forehead should be inside the guide box.",
    },
  },
  {
    id: "white",
    word: "WHITE",
    params: {
      handshape: "Open-5 on chest, close to flat-O as hand pulls away",
      movement: "Hand pulls away from chest while fingers close",
      location: "Center chest → neutral space",
      orientation: "Palm facing chest, then rotating out",
    },
    hints: {
      handshape: "Start with open-5 on chest, close fingers to a flat-O as you pull away.",
      movement: "Pull hand away from chest while fingers come together.",
      location: "Start at center chest.",
      orientation: "Palm begins facing your chest.",
      framing: "The pull-away arc should be inside the guide box.",
    },
  },

  // ── Family ───────────────────────────────────────────────────────────────
  {
    id: "mother",
    word: "MOTHER",
    params: {
      handshape: "Open-5 (all fingers spread), thumb extended",
      movement: "Thumb taps chin twice",
      location: "Chin",
      orientation: "Palm facing left (sideways)",
    },
    hints: {
      handshape: "Spread all five fingers wide, thumb prominent.",
      movement: "Tap your thumb to your chin twice.",
      location: "Chin. Female signs are typically at chin; male signs at forehead.",
      orientation: "Palm faces sideways, not toward you or outward.",
      framing: "Keep your chin and hand inside the guide box.",
    },
  },
  {
    id: "father",
    word: "FATHER",
    params: {
      handshape: "Open-5 (all fingers spread), thumb extended",
      movement: "Thumb taps forehead twice",
      location: "Forehead",
      orientation: "Palm facing left (sideways)",
    },
    hints: {
      handshape: "Same handshape as MOTHER — spread open-5 with prominent thumb.",
      movement: "Tap your thumb to your forehead twice. Not your chin.",
      location: "Forehead. This is what distinguishes FATHER from MOTHER.",
      orientation: "Palm faces sideways.",
      framing: "Keep your forehead and hand inside the guide box.",
    },
  },
  {
    id: "sister",
    word: "SISTER",
    params: {
      handshape: "L-hand (index and thumb extended at 90°), starting at chin",
      movement: "Moves from chin down to land on other L-hand",
      location: "Chin → neutral space",
      orientation: "Palm facing sideways",
    },
    hints: {
      handshape: "L-shape: index finger points forward, thumb points up.",
      movement: "Start at chin (female marker), arc down to meet your other hand.",
      location: "Starts at chin for the female marker.",
      orientation: "Index finger points forward throughout.",
      framing: "Both chin and landing position should be visible in the guide box.",
    },
  },
  {
    id: "brother",
    word: "BROTHER",
    params: {
      handshape: "L-hand starting at forehead",
      movement: "Moves from forehead down to land on other L-hand",
      location: "Forehead → neutral space",
      orientation: "Palm facing sideways",
    },
    hints: {
      handshape: "Same L-shape as SISTER but starts at forehead.",
      movement: "Start at forehead (male marker), arc down to meet your other hand.",
      location: "Starts at forehead — this is the male marker.",
      orientation: "Index finger points forward.",
      framing: "Both forehead and landing position should be visible in the guide box.",
    },
  },
  {
    id: "baby",
    word: "BABY",
    params: {
      handshape: "Both arms crossed, cradling position",
      movement: "Rock arms side to side (cradling a baby)",
      location: "Chest/waist level",
      orientation: "Arms crossed, palms up",
    },
    hints: {
      handshape: "Cross your arms at chest level, palms facing upward.",
      movement: "Rock your crossed arms gently side to side.",
      location: "In front of your chest.",
      orientation: "Palms face upward, as if holding something.",
      framing: "Both arms should be inside the guide box.",
    },
  },
  {
    id: "family",
    word: "FAMILY",
    params: {
      handshape: "Both F-hands (index and thumb touching, other fingers extended)",
      movement: "Hands start touching thumbs, arc outward and around until pinkies touch",
      location: "Neutral space, chest height",
      orientation: "Palms facing outward",
    },
    hints: {
      handshape: "F-handshape: touch index finger to thumb, extend other three fingers.",
      movement: "Start with both F-hands touching, arc outward in a circle until pinkies meet.",
      location: "Neutral chest-level space.",
      orientation: "Palms face outward at the start.",
      framing: "The full arc must be inside the guide box.",
    },
  },

  // ── Common Verbs ─────────────────────────────────────────────────────────
  {
    id: "eat",
    word: "EAT",
    params: {
      handshape: "Flat-O (fingers bunched together, touching thumb)",
      movement: "Taps mouth twice",
      location: "Mouth",
      orientation: "Palm facing self",
    },
    hints: {
      handshape: "Bunch all fingertips together to meet the thumb — like pinching a bite of food.",
      movement: "Tap the bunched fingers to your mouth twice.",
      location: "Directly at your mouth.",
      orientation: "Fingertips point toward your mouth.",
      framing: "Your mouth and hand should be inside the guide box.",
    },
  },
  {
    id: "drink",
    word: "DRINK",
    params: {
      handshape: "C-hand (curved, like holding a cup)",
      movement: "Tips toward mouth as if drinking",
      location: "Mouth",
      orientation: "Thumb toward mouth, fingers up",
    },
    hints: {
      handshape: "Curve your hand like you're gripping a glass — C shape.",
      movement: "Tilt the hand toward your mouth, like you're drinking from a cup.",
      location: "Movement ends at your mouth.",
      orientation: "Thumb side closest to your mouth.",
      framing: "Your mouth and hand should be inside the guide box.",
    },
  },
  {
    id: "want",
    word: "WANT",
    params: {
      handshape: "Both open-5 hands, bent/clawed (5-hand with curved fingers)",
      movement: "Pull both hands toward body while fingers curl inward",
      location: "Neutral space in front of chest",
      orientation: "Palms facing up",
    },
    hints: {
      handshape: "Both hands: spread fingers, then curve them like claws.",
      movement: "Pull both claw-hands toward your chest while fingers curl in.",
      location: "Start out in front of you, pull toward chest.",
      orientation: "Palms face upward throughout.",
      framing: "Both hands should be inside the guide box.",
    },
  },
  {
    id: "like",
    word: "LIKE",
    params: {
      handshape: "Open-5 on chest, middle finger and thumb pinch as hand moves out",
      movement: "Middle finger and thumb pull away from chest pinching together",
      location: "Chest → neutral space",
      orientation: "Palm facing chest initially",
    },
    hints: {
      handshape: "Start open-5 on chest; close your middle finger and thumb together as you pull away.",
      movement: "Pull middle finger + thumb pinch away from your chest.",
      location: "Starts at your chest.",
      orientation: "Palm faces your chest at the start.",
      framing: "Keep chest and the pull-away motion inside the guide box.",
    },
  },
  {
    id: "love",
    word: "LOVE",
    params: {
      handshape: "Both arms crossed over chest (fists or flat hands)",
      movement: "Static or slight press into chest",
      location: "Chest",
      orientation: "Arms crossed, hands near shoulders",
    },
    hints: {
      handshape: "Cross both arms over your chest — can be fists or flat hands.",
      movement: "Hold position or gently press arms into chest.",
      location: "Centered on your chest.",
      orientation: "Arms crossed, hands near opposite shoulders.",
      framing: "Both arms should be inside the guide box.",
    },
  },
  {
    id: "help",
    word: "HELP",
    params: {
      handshape: "A-hand (fist) on flat B palm (other hand)",
      movement: "Flat B palm lifts the A-hand fist upward",
      location: "Neutral space, waist height",
      orientation: "A-hand on top of B-hand, both palms up",
    },
    hints: {
      handshape: "One hand is a flat palm, the other is a fist sitting on top of it.",
      movement: "The flat palm pushes the fist upward.",
      location: "In front of you at about waist height.",
      orientation: "Both palms face upward.",
      framing: "Both hands must be inside the guide box.",
    },
  },
  {
    id: "know",
    word: "KNOW",
    params: {
      handshape: "Flat-B or bent hand",
      movement: "Fingertips tap temple/side of head twice",
      location: "Temple",
      orientation: "Palm facing self",
    },
    hints: {
      handshape: "Bent or flat hand — fingertips together.",
      movement: "Tap fingertips to your temple twice.",
      location: "Temple, side of your head.",
      orientation: "Fingertips point toward your head.",
      framing: "Your head and hand should be inside the guide box.",
    },
  },
  {
    id: "understand",
    word: "UNDERSTAND",
    params: {
      handshape: "S-hand (fist) near temple, index flicks up (X/1 transition)",
      movement: "Index finger flicks upward from fist at temple",
      location: "Temple / side of forehead",
      orientation: "Palm facing self",
    },
    hints: {
      handshape: "Start with a fist near your temple, then flick your index finger up.",
      movement: "Flick! The index finger snaps upward from your fist — one quick motion.",
      location: "At your temple, not your chin or forehead center.",
      orientation: "Palm faces your head.",
      framing: "Your temple and hand should be inside the guide box.",
    },
  },
  {
    id: "go",
    word: "GO",
    params: {
      handshape: "Both 1-hands (index fingers extended)",
      movement: "Both index fingers arc from pointing toward body to pointing away",
      location: "Neutral space, chest height",
      orientation: "Starts pointing up/inward, ends pointing outward/forward",
    },
    hints: {
      handshape: "Both index fingers extended, other fingers tucked.",
      movement: "Arc both index fingers outward — they go from pointing at you to pointing away.",
      location: "Neutral space at chest height.",
      orientation: "Fingers end up pointing in the direction of travel.",
      framing: "The arc of both hands should be inside the guide box.",
    },
  },
  {
    id: "come",
    word: "COME",
    params: {
      handshape: "Both 1-hands (index fingers extended)",
      movement: "Both index fingers arc from pointing away to pointing toward body",
      location: "Neutral space",
      orientation: "Starts pointing outward, ends pointing toward self",
    },
    hints: {
      handshape: "Both index fingers extended.",
      movement: "Arc both fingers inward — the reverse of GO. They bend toward you.",
      location: "Neutral space at chest height.",
      orientation: "Fingers end up pointing toward you.",
      framing: "The inward arc should be inside the guide box.",
    },
  },
  {
    id: "see",
    word: "SEE",
    params: {
      handshape: "V-hand (index and middle extended)",
      movement: "V-hand moves from near eyes forward",
      location: "Eyes → neutral space",
      orientation: "Palm facing down, V points forward",
    },
    hints: {
      handshape: "Two fingers extended in a V shape — like pointing your eyes forward.",
      movement: "Start the V near your eyes and move it forward.",
      location: "Begins near your eyes.",
      orientation: "The V points outward in the direction you're looking.",
      framing: "Your eyes and the outward motion should both be in the guide box.",
    },
  },
  {
    id: "learn",
    word: "LEARN",
    params: {
      handshape: "Flat-O (fingers bunched) touches flat palm, then moves to forehead closing",
      movement: "Picks from flat palm and brings to forehead, closing to flat-O",
      location: "Palm → forehead",
      orientation: "Active hand palm down on other palm, then rotates",
    },
    hints: {
      handshape: "Bunched fingers pick from your flat palm and bring the pinch to your forehead.",
      movement: "Like picking information up and putting it in your head.",
      location: "Starts at your flat (non-dominant) palm, ends at your forehead.",
      orientation: "Fingertips face down toward palm, then rotate to face forehead.",
      framing: "Both your palm and forehead should be in the guide box.",
    },
  },
  {
    id: "sleep",
    word: "SLEEP",
    params: {
      handshape: "Open-5, fingers spread",
      movement: "Hand draws down over face as fingers close",
      location: "Face → chin",
      orientation: "Palm facing self, draws downward",
    },
    hints: {
      handshape: "Open hand, all five fingers spread, in front of your face.",
      movement: "Draw the hand downward as if closing your eyes — fingers close as it moves.",
      location: "Begins above your face level, moves down past your chin.",
      orientation: "Palm faces your face throughout.",
      framing: "Your face and the downward motion should be inside the guide box.",
    },
  },

  // ── Pronouns / Reference ─────────────────────────────────────────────────
  {
    id: "i-me",
    word: "I / ME",
    params: {
      handshape: "1-hand or flat hand pointing",
      movement: "Index finger or flat hand points to own chest",
      location: "Chest",
      orientation: "Pointing toward self",
    },
    hints: {
      handshape: "Point with your index finger, or use a flat hand.",
      movement: "Point at your own chest.",
      location: "Your chest — not up at your face.",
      orientation: "Finger points at you.",
      framing: "Your chest should be inside the guide box.",
    },
  },
  {
    id: "you",
    word: "YOU",
    params: {
      handshape: "1-hand (index finger extended)",
      movement: "Point forward (toward the person being addressed)",
      location: "Neutral space, pointing forward",
      orientation: "Index pointing outward",
    },
    hints: {
      handshape: "Just your index finger extended.",
      movement: "Point directly forward.",
      location: "In front of you at chest level.",
      orientation: "Finger points away from you.",
      framing: "Keep your pointing hand inside the guide box.",
    },
  },

  // ── Common Nouns ─────────────────────────────────────────────────────────
  {
    id: "water",
    word: "WATER",
    params: {
      handshape: "W-hand (index, middle, ring extended) taps chin",
      movement: "Taps chin twice",
      location: "Chin",
      orientation: "Palm facing left/sideways",
    },
    hints: {
      handshape: "W-hand: index, middle, and ring fingers extended, others tucked.",
      movement: "Tap the W to your chin twice.",
      location: "Chin — not forehead or lips.",
      orientation: "Three fingers point sideways.",
      framing: "Your chin and hand should be inside the guide box.",
    },
  },
  {
    id: "home",
    word: "HOME",
    params: {
      handshape: "Flat-O (fingers bunched)",
      movement: "Taps cheek near mouth, then near ear",
      location: "Cheek near mouth → cheek near ear",
      orientation: "Palm facing sideways",
    },
    hints: {
      handshape: "Bunch your fingertips to your thumb — flat-O.",
      movement: "Two taps: one near your mouth, one near your ear.",
      location: "Two locations on your cheek.",
      orientation: "Fingertips face your cheek.",
      framing: "Both cheek positions should be inside the guide box.",
    },
  },
  {
    id: "school",
    word: "SCHOOL",
    params: {
      handshape: "Flat-B dominant hand claps on flat-B non-dominant hand",
      movement: "Dominant hand claps non-dominant twice",
      location: "Neutral space, waist-chest height",
      orientation: "Non-dominant palm up, dominant palm down",
    },
    hints: {
      handshape: "Both hands flat, all fingers together.",
      movement: "Dominant hand claps down on the stationary non-dominant hand twice.",
      location: "In front of you at about chest height.",
      orientation: "Non-dominant palm faces up; dominant palm faces down.",
      framing: "Both hands should be inside the guide box.",
    },
  },
  {
    id: "book",
    word: "BOOK",
    params: {
      handshape: "Both flat-B hands, palms together",
      movement: "Hands open like a book (rotate apart at heel)",
      location: "Neutral space, chest height",
      orientation: "Starts palms together, ends palms facing up",
    },
    hints: {
      handshape: "Both hands flat, pressed palm-to-palm.",
      movement: "Open them like a book — rotate outward at the base (heel of hand stays together).",
      location: "Neutral chest-level space.",
      orientation: "Ends with both palms facing up.",
      framing: "The full opening motion should be inside the guide box.",
    },
  },
  {
    id: "name",
    word: "NAME",
    params: {
      handshape: "Both H-hands (index and middle extended, parallel, horizontal)",
      movement: "Dominant H crosses over non-dominant H at middle joints",
      location: "Neutral space",
      orientation: "Both palms face down, fingers point sideways",
    },
    hints: {
      handshape: "H-hand: index and middle fingers extended together, pointing sideways.",
      movement: "Cross your dominant H over your non-dominant H.",
      location: "Neutral space in front of you.",
      orientation: "Fingers point sideways, palms face down.",
      framing: "Both hands should be inside the guide box.",
    },
  },

  // ── Questions ────────────────────────────────────────────────────────────
  {
    id: "what",
    word: "WHAT",
    params: {
      handshape: "Open-5 or flat hands, slightly bent",
      movement: "Hands shake side to side (or index brushes across fingers of other hand)",
      location: "Neutral space",
      orientation: "Palms up or facing each other",
    },
    hints: {
      handshape: "Open or slightly bent hands.",
      movement: "Shake hands side to side with a questioning expression.",
      location: "Neutral chest-level space.",
      orientation: "Palms generally face upward.",
      framing: "Both hands should be inside the guide box.",
    },
  },
  {
    id: "where",
    word: "WHERE",
    params: {
      handshape: "1-hand (index extended)",
      movement: "Index wags side to side",
      location: "Neutral space",
      orientation: "Index points upward, wagging",
    },
    hints: {
      handshape: "Just your index finger extended.",
      movement: "Wag the index finger side to side — like you're saying 'uh-uh'.",
      location: "Neutral space in front of you.",
      orientation: "Index points upward as it wags.",
      framing: "Keep your hand inside the guide box.",
    },
  },
  {
    id: "who",
    word: "WHO",
    params: {
      handshape: "L-hand (index and thumb extended), index traces lip circle",
      movement: "Index finger traces circle around lips",
      location: "Lips",
      orientation: "Palm facing sideways, index toward face",
    },
    hints: {
      handshape: "L-shape: index extended forward, thumb up.",
      movement: "Trace a circle around your lips with your index finger.",
      location: "Around your mouth/lips.",
      orientation: "Index finger points toward your face.",
      framing: "Your mouth and hand should be inside the guide box.",
    },
  },
  {
    id: "how",
    word: "HOW",
    params: {
      handshape: "Both bent hands (knuckles facing each other)",
      movement: "Hands rotate upward, knuckles brushing as they open",
      location: "Neutral space",
      orientation: "Knuckles facing each other, then rotating up",
    },
    hints: {
      handshape: "Both hands bent at knuckles, facing each other.",
      movement: "Roll hands upward so knuckles brush past each other as palms face up.",
      location: "Neutral chest-level space.",
      orientation: "Ends with palms facing up.",
      framing: "Both hands should be inside the guide box.",
    },
  },
  {
    id: "why",
    word: "WHY",
    params: {
      handshape: "Bent hand at forehead, middle finger extends as hand moves out",
      movement: "Fingers touch forehead then move out with middle finger extended",
      location: "Forehead → neutral space",
      orientation: "Palm facing self",
    },
    hints: {
      handshape: "Bent hand touches forehead, then middle finger extends outward.",
      movement: "Touch forehead with bent fingers, pull away while extending middle finger.",
      location: "Starts at forehead.",
      orientation: "Palm faces your forehead initially.",
      framing: "Your forehead and the outward motion should be in the guide box.",
    },
  },

  // ── Descriptors ──────────────────────────────────────────────────────────
  {
    id: "big",
    word: "BIG",
    params: {
      handshape: "Both L-hands (index and thumb extended)",
      movement: "Hands move apart to show large size",
      location: "Neutral space",
      orientation: "Thumbs up, index fingers pointing sideways",
    },
    hints: {
      handshape: "L-shape both hands: index forward, thumb up.",
      movement: "Move hands apart as if measuring something large.",
      location: "Neutral chest-level space.",
      orientation: "Index fingers point sideways.",
      framing: "The full width of the motion should be inside the guide box.",
    },
  },
  {
    id: "small",
    word: "SMALL",
    params: {
      handshape: "Both flat-B hands",
      movement: "Hands come close together (showing small size)",
      location: "Neutral space",
      orientation: "Palms facing each other",
    },
    hints: {
      handshape: "Both hands flat.",
      movement: "Bring hands close together, almost touching — showing small size.",
      location: "Neutral space.",
      orientation: "Palms face each other.",
      framing: "Both hands should be inside the guide box.",
    },
  },
  {
    id: "hot",
    word: "HOT",
    params: {
      handshape: "Bent-5 (curved claw) in front of mouth",
      movement: "Hand twists outward from mouth, like throwing away hot food",
      location: "Mouth → neutral space",
      orientation: "Starts palm toward mouth, twists outward",
    },
    hints: {
      handshape: "Claw hand — all fingers curved — in front of your mouth.",
      movement: "Twist the claw outward and away from your mouth in one motion.",
      location: "Starts in front of your mouth.",
      orientation: "Palm begins facing your mouth, twists to face outward.",
      framing: "Your mouth and hand should be inside the guide box.",
    },
  },
  {
    id: "cold",
    word: "COLD",
    params: {
      handshape: "Both S-hands (fists)",
      movement: "Fists shake near shoulders (shivering motion)",
      location: "Shoulders / upper chest",
      orientation: "Fists facing each other",
    },
    hints: {
      handshape: "Both fists.",
      movement: "Shake both fists near your shoulders like you're shivering.",
      location: "Near your shoulders, not low in front.",
      orientation: "Fists face each other.",
      framing: "Both fists should be inside the guide box.",
    },
  },
];

export const VOCAB_COUNT = VOCAB.length;
