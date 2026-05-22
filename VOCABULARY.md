# Stokoe — Proposed Training Vocabulary (64 signs)

This document is for review and approval. These 64 signs form the proposed training target — the subset we will filter from ASL Citizen's 2,731 signs. Each sign was selected for: (1) presence in standard ASL 1 curricula, (2) distinctive motion profile that a from-scratch CNN+LSTM can learn, and (3) likely coverage in the ASL Citizen dataset.

---

## Greetings & Social (10)
1. HELLO
2. GOODBYE
3. PLEASE
4. THANK YOU
5. SORRY
6. YOU'RE WELCOME
7. YES
8. NO
9. GOOD
10. BAD

*Why these:* High-frequency ASL 1 targets. HELLO, THANK YOU, PLEASE, and SORRY have highly distinctive whole-arm or face-contact motions — among the easiest signs to distinguish from scratch. YES and NO are simple but recognizable. GOOD and BAD share a handshape but differ critically in the flip direction, which tests whether the motion model is working.

---

## Numbers 1–10 (10)
11. ONE
12. TWO
13. THREE
14. FOUR
15. FIVE
16. SIX
17. SEVEN
18. EIGHT
19. NINE
20. TEN

*Why these:* Universal ASL 1 content. Numbers 1–5 are static handshapes and will be harder for the model (no motion to distinguish). Numbers 6–10 have more distinctive configurations. Including them tests the limits of the model honestly — expected lower accuracy on 1–5 vs. 6–10 is a meaningful finding for the validation report.

---

## Colors (8)
21. RED
22. BLUE
23. GREEN
24. YELLOW
25. ORANGE
26. PURPLE
27. BLACK
28. WHITE

*Why these:* Standard ASL 1 color vocabulary. Most color signs involve a handshape near the mouth or chin with a wrist twist — relatively distinctive as a group. ORANGE (squeezing motion) and WHITE (pulling-away motion) are the most kinematically distinctive and likely to perform best.

---

## Family (6)
29. MOTHER
30. FATHER
31. SISTER
32. BROTHER
33. BABY
34. FAMILY

*Why these:* Core ASL 1 family vocabulary. MOTHER and FATHER are an intentional near-pair — same handshape, different location (chin vs. forehead). If the model can distinguish them, it's learning location as a feature. BABY and FAMILY have distinctive two-handed motions.

---

## Common Verbs (13)
35. EAT
36. DRINK
37. WANT
38. LIKE
39. LOVE
40. HELP
41. KNOW
42. UNDERSTAND
43. GO
44. COME
45. SEE
46. LEARN
47. SLEEP

*Why these:* Action-forward signs with high visual distinctiveness. EAT, DRINK, SLEEP, and LOVE are among the most iconically recognizable signs in ASL — good for demo. GO and COME are a directional pair that tests whether the model captures motion direction.

---

## Pronouns (2)
48. I / ME
49. YOU

*Why these:* Minimal but necessary. Both are pointing signs distinguished only by direction. Kept to just two to avoid overloading the pointing-sign class with too many similar examples.

---

## Common Nouns (5)
50. WATER
51. HOME
52. SCHOOL
53. BOOK
54. NAME

*Why these:* Distinctive-motion nouns. BOOK (two hands opening) and SCHOOL (clapping motion) have strong two-handed kinematic signatures. WATER (W-hand tap to chin) introduces a multi-finger configuration. HOME has a distinctive two-location tap sequence.

---

## Questions (5)
55. WHAT
56. WHERE
57. WHO
58. HOW
59. WHY

*Why these:* Question signs are high-frequency in ASL 1. WHERE (wagging index), WHO (circle around lips), and WHY (forehead brush + middle finger) are kinematically distinctive. These also test whether the model handles facial-area signs vs. neutral-space signs.

---

## Descriptors (4)
60. BIG
61. SMALL
62. HOT
63. COLD

*Why these:* HOT (twist away from mouth) and COLD (shivering fists) are highly distinctive. BIG and SMALL are spatial concepts that test whether the model captures hand-spread differences.

---

## What's deliberately excluded and why

- **Fingerspelling (A–Z):** Configuration-only distinctions at a small scale — extremely hard to learn from scratch with limited data. Several letters (B/D/F/K/P/R) differ by millimeters of finger position. Reserved for a future model iteration.
- **Days of the week / months:** Signed near the shoulder with a rotating motion — distinctive as a group but require many examples to separate individually.
- **Emotions (HAPPY, SAD, ANGRY, etc.):** Often signed on the face with subtle distinctions. Added complexity without adding ASL 1 curriculum value at this stage.
- **WATER vs. MOTHER:** Both are chin-contact signs — kept both because the handshape difference (W vs. open-5) should be learnable, and it's an honest test case.

---

## Next step

Cross-reference each sign ID against ASL Citizen's label vocabulary to confirm coverage before training. Any sign not found in ASL Citizen should either be dropped or supplemented with clips from the Thursday cohort validation session.
