# Stokoe Notation — Complete Reference

*Synthesized from: Wikipedia, Unicode L2/12-133 (2012), Gagne & Hamilton Quick Guide (2021), Grieve-Smith font documentation, ScriptSource Qaaq.*

## System Overview

Stokoe notation (1960, formalized 1965) uses **55 symbols** total: 12 tab, 19 dez, 24 sig.
Sign order: **tab – dez(orientation-subscript) – sig(superscript)** = `TDs`

Not in Unicode. Use **StokoeTempo font** (Grieve-Smith) + ASCII-Stokoe encoding (Mandel 1993).
Font download: https://www.panix.com/~grvsmth/stokoe/ (WOFF2 available, free for education)

---

## DEZ — Handshape — 19 Symbols

| Symbol | ASCII-Stokoe | ASL Handshape(s) |
|--------|-------------|------------------|
| A | A | fist (A, S, T variants) |
| B | B | flat hand (B, 4) |
| 5 | 5 | spread hand |
| C | C | cupped/curved |
| E | E | bent claw |
| F | F | F / okay |
| G | G | index point (G, D, 1) |
| H | H | two-finger flat (H, N, U) |
| I | I | pinkie only |
| K | K | modified V (thumb touches middle of V) |
| L | L | L-shape (index + thumb at right angle) |
| 3 | 3 | three-finger (thumb, index, middle) |
| O | O | tapered O |
| R | R | crossed fingers |
| V | V | spread V (V, 2) |
| W | W | three-finger spread |
| X | X | hook / bent index |
| Y | Y | horns (thumb + pinkie) |
| 8 | 8 | bent middle finger touches thumb |

**Dez modifiers:**
- Dot above dez: a non-prominent finger is extended
- Breve-like marks: fingers are flexed/bent

---

## TAB — Location — 12 Symbols

| Symbol | ASCII | Location |
|--------|-------|----------|
| Ø | 0 | Neutral space (in front of body, not touching) |
| ⩇ | Q | Face / whole head |
| ∩ | P | Forehead / brow / upper face |
| ⊔ | T | Eyes, nose, mid-face |
| ∪ | U | Lips / chin / lower face |
| Ȝ | } | Cheek / temple / ear / side of face |
| Π | N | Neck |
| [ ] | [ ] | Trunk (shoulder to hip, torso) |
| Ƨ | 7 | Upper arm (non-dominant) |
| √ | J | Elbow / forearm (non-dominant) |
| ɑ | 9 | Inside of wrist (supinated, palm up) |
| ɒ | 6 | Back of wrist (pronated, palm down) |

**Passive hand as tab:** when the non-dominant hand is the location, its dez symbol goes in the tab position.

---

## SIG — Movement — 24 Symbols

### Vertical
| Symbol | ASCII | Meaning |
|--------|-------|---------|
| ʌ (superscript) | D^ | Upward |
| v (superscript) | Dv | Downward |
| ɴ (superscript) | Dw | Up and down (repeated) |

### Sideways
| Symbol | ASCII | Meaning |
|--------|-------|---------|
| > (superscript) | D> | Toward dominant side |
| < (superscript) | D< | Toward center / non-dominant |
| ≷ (superscript) | Dz | Side to side (repeated) |

### Horizontal (depth)
| Symbol | ASCII | Meaning |
|--------|-------|---------|
| ⊤ (superscript) | Dt | Toward signer |
| ⊥ (superscript) | Df | Away from signer (forward) |
| ᶦ (superscript) | Dm | To and fro (repeated) |

### Rotary
| Symbol | ASCII | Meaning |
|--------|-------|---------|
| ɑ (superscript) | Da | Supinate (palm faces up) |
| ɒ (superscript) | Db | Pronate (palm faces down) |
| ω (superscript) | Dg | Wrist twist back and forth |
| ᵑ (superscript) | Dr | Nod / wrist bend up-down |

### Interaction
| Symbol | ASCII | Meaning |
|--------|-------|---------|
| open bracket | D*[ ] | Open up (resulting dez in brackets) |
| # | D#[ ] | Close up |
| ᴥ | De | Wiggle fingers |
| @ | D@ | Circular path |
| ⁾⁽ | D)( | Approach (two units move together) |
| ₎₍ | )( | Near / static proximity |
| × | Dx | Contact / touch |
| ≬ | D$ | Link / grasp / interlock |
| ‡ | D+ | Cross (one hand over other) |
| ʘ | Do | Enter (hand enters a space) |
| ÷ | D% | Separate / diverge |
| ʻʼ | D& | Exchange positions (hands swap) |

**Sig modifiers:**
- Dot above sig: sharp/abrupt single motion
- Dot after sig (·): motion is repeated
- Tilde after two-handed sig (~): sequential (one hand then the other)

---

## Orientation Subscripts (on dez)

| Symbol | ASCII | Meaning |
|--------|-------|---------|
| ʌ subscript | ^D | Palm/fingers pointing up |
| v subscript | vD | Palm/fingers pointing down |
| > subscript | >D | Palm facing dominant side |
| < subscript | <D | Palm facing center |
| ⊤ subscript | tD | Palm toward signer |
| ⊥ subscript | fD | Palm away from signer |
| ɑ subscript | aD | Supine (palm up) |
| ɒ subscript | bD | Prone (palm down) |
| ŋ subscript | rD | Wrist bent |

---

## Corpus Symbol Corrections

From the Goldilocks passage — corrected interpretations:

| Corpus symbol | Correct interpretation |
|--------------|----------------------|
| ɑ | Inside of wrist (supinated) tab — NOT generic neutral space |
| ⊥ after dez | Orientation subscript: palm away from signer |
| ⊤ after dez | Orientation subscript: palm toward signer |
| √ in tab position | Elbow/forearm location tab |
| ʌ in tab position | Upper space (or orientation subscript: fingers up) |

---

## Browser Rendering

**StokoeTempo font** (Angus Grieve-Smith): WOFF2 available at https://www.panix.com/~grvsmth/stokoe/
- Load via @font-face
- Write ASCII-Stokoe strings (the ASCII column above)
- Apply font-family — ASCII chars render as Stokoe glyphs
- For superscripts/subscripts: use CSS `position: relative` with `<span>` elements, or SVG

**Stokoe is not in Unicode** — use the font approach, not Unicode code points.

Script code: Qaaq (ScriptSource/SIL)

---

## Sources

- Wikipedia: Stokoe notation
- Unicode L2/12-133 (2012): Towards a Unicode Encoding for Stokoe Notation
- Gagne & Hamilton: Quick Guide to Stokoe Notation (2021) — https://figshare.com/articles/journal_contribution/Quick_Guide_to_Stokoe_Notation/7379939
- Grieve-Smith: Fonts for Stokoe Notation (2022) — https://grieve-smith.com/blog/2022/05/fonts-for-stokoe-notation/
- StokoeTempo font — https://www.panix.com/~grvsmth/stokoe/
- ScriptSource Qaaq — https://scriptsource.org/scr/Qaaq
