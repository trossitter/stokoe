# Vocabulary Selection Defense
## Why We Didn't Google "Easiest ASL Signs"

---

### The Trap

Every team working on a beginner ASL application faces the same first decision: which signs to teach? The obvious answer is a Google search. "Easiest ASL signs for beginners" returns the same list everywhere — HELLO, PLEASE, THANK YOU, the numbers 1 through 10, basic colors. This list exists because it is pedagogically comfortable: the signs are common, they appear in every intro curriculum, and learners feel immediate utility from them.

This list is architecturally disastrous.

---

### What Phonology Means Here

In ASL linguistics — following William Stokoe's 1960 monograph *Sign Language Structure* and formalized in Liddell & Johnson's landmark 1989 paper "American Sign Language: The Phonological Base" (*Sign Language Studies* 64) — the sub-lexical structure of signs is called **phonology**. The four phonological parameters are:

- **Tab** — location relative to the body (forehead, chin, chest, neutral space)
- **Dez** — handshape (flat hand, fist, index finger, curved, spread)
- **Sig** — movement (circular, contact/tap, arc, twist, static hold)
- **Orientation** — palm direction (outward, toward body, upward, sideways)

Using the word "phonology" for ASL is not metaphorical. It is the standard academic term, used in every graduate-level ASL linguistics course, because signed languages are full natural languages with the same organizational levels as spoken languages — just expressed through a different channel. Stokoe himself made this argument in 1960, at a time when it was deeply controversial. He was right.

**The demo line:** "We treated vocabulary selection as an optimization problem over the phonological parameter space — the same framework Stokoe defined in 1960."

---

### The Numbers Cluster: The Case in Numbers

Our k-means analysis of the 63-sign beginner vocabulary produced 8 clusters. The tightest cluster — the one with the highest mean intra-cluster similarity — was the number signs.

The numbers 1 through 8 share:
- **Tab:** all neutral space (hand held in front of body, no contact)
- **Sig:** all static hold (no movement whatsoever)
- **Orientation:** all palm-forward

The only parameter that varies: **Dez** (handshape). Specifically, the number of fingers extended.

These 8 signs occupy a single point in a 3-dimensional subspace. They are phonological minimal pairs — differing in exactly one parameter, the way "bat" and "cat" differ in exactly one phoneme. 8 signs. 13% of the vocabulary budget. Near-zero contribution to phonological diversity across 3 of 4 parameters.

**The quantitative proof:** Our clustering script computes pairwise cosine similarity across all four Stokoe parameters. THREE and FOUR score a similarity of **1.000** — literally identical in our metric. Same location (neutral space), same movement (static hold), same orientation (palm-forward). The only difference is the number of fingers extended. The numbers cluster as a whole scores a mean intra-cluster similarity of **0.770**, the highest of any group in the vocabulary. By contrast, the most phonologically distant pair in the entire vocabulary — HELLO and GREEN — scores **0.000**. Those are the poles of the space. We want our training vocabulary to cover the full distance from 0.000 to 1.000, not cluster at one end.

**What this means for the model:** A classifier trained on this vocabulary must essentially count fingers in a webcam feed to distinguish ONE from TWO from THREE. That is a genuinely hard sub-problem — finger individuation under motion blur, partial occlusion, variable lighting — and more importantly, it is the *wrong problem* for a pilot. We have made the model's hardest job its most common one.

**What this means for feedback:** When a learner fails a number sign, the hint system cannot say anything precise. "Your handshape is wrong" — wrong compared to which of the seven other number signs that share the same location, movement, and orientation? The feedback hedges. And vague feedback is the enemy of learning. The PRD says it directly: "Distinct is a higher value and a higher priority" than ambiguous.

---

### What We Did Instead

We ran k-means clustering on the Stokoe parameter space. The algorithm mapped each sign to a point in a 30-dimensional feature space (one-hot encoded Tab, Dez, Sig, and Orientation) and found 8 natural groupings. Then, instead of choosing the most common signs *within* each cluster, we selected the **most isolated representatives** — the signs with the most phonological breathing room around them.

**From the numbers cluster:** one representative, not eight. The freed budget goes to signs in underrepresented parameter regions — signs that use face-contact locations, bilateral movement, or motion-based Sig types that the number signs never touch.

The result is a vocabulary where:
1. Every sign occupies a distinct region of the phonological space
2. Every classification decision is architecturally clean — signs don't crowd each other
3. Every piece of feedback points to exactly one correctable parameter

**If someone asks why k-means:** "It finds compact, named groups. I can show you the clusters, point to each one, explain what the signs have in common, and explain which representative we chose and why. It is transparent. We are not hiding the math."

---

### The Line That Lands

> "We didn't ask which signs are easiest. We asked which signs are most distinct from each other — because in a pilot, distinction is what makes feedback meaningful."

---

### What to Say If Someone Asks About "Phonology"

> "In ASL linguistics, the sub-lexical structure of signs — handshape, location, movement, orientation — is called phonology. This follows Stokoe's own 1960 framework and has been the standard academic term since Liddell and Johnson's 1989 paper. We used that framework as our selection criterion."

Do not apologize for using the term. It is correct.

---

### The Overcome Moment

> "Every intro ASL curriculum teaches numbers 1 through 10. They're useful, they're universal, they're beginner-friendly. And they are nearly identical signs. Our clustering revealed that 8 number signs share the same location, the same movement, and the same orientation. The only difference is how many fingers you hold up. That is one parameter out of four. We kept one number sign as a cluster representative and used the freed budget on signs that actually test the full range of what the notation system can describe. That's the decision no one else will have made, and it's why our model can give you a precise hint rather than a hedge."
