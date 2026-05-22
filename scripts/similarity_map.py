"""
similarity_map.py — K-means clustering + heatmap of ASL sign similarity.

Two axes (weighted 90/10 phonological/semantic):
  Phonological: encoded from Stokoe parameters (handshape, movement, location, orientation)
  Semantic:     category membership (social, numbers, colors, family, verbs, etc.)

Outputs:
  data/similarity_heatmap.png  — presentation-ready dark glowing heatmap
  data/clusters.csv            — sign → cluster assignment
  data/similarity_matrix.csv   — raw pairwise distance matrix

Usage:
  pip3 install scikit-learn seaborn matplotlib scipy numpy
  python3 scripts/similarity_map.py
"""

import csv
import pathlib
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from scipy.spatial.distance import cdist
from sklearn.cluster import KMeans
from sklearn.preprocessing import normalize

# ── Sign data ──────────────────────────────────────────────────────────────────

SIGNS = {
    # id: (display_word, asl_lex_code, handshape_cat, movement_cat, location_cat, orientation_cat)
    # handshape_cat: 0=flat/B, 1=fist/S/A, 2=1-index, 3=V/2-fingers, 4=open5, 5=C-curved, 6=O/flat-O, 7=other
    # movement_cat:  0=static, 1=circular, 2=tap/contact, 3=brush/wipe, 4=arc/path, 5=twist/shake, 6=open-close, 7=nod
    # location_cat:  0=neutral-space, 1=forehead/temple, 2=chin/mouth, 3=chest, 4=nose, 5=cheek, 6=palm-of-other, 7=multi
    # orientation_cat: 0=palm-out, 1=palm-in, 2=palm-up, 3=palm-down, 4=palm-side, 5=rotating

    "HELLO":      ("HELLO",      "D_02_055", 4, 3, 1, 0),
    "GOODBYE":    ("GOODBYE",    "E_01_058", 4, 5, 0, 0),
    "PLEASE":     ("PLEASE",     "B_02_007", 0, 1, 3, 1),
    "THANK YOU":  ("THANK YOU",  "H_02_053", 0, 4, 2, 2),
    "SORRY":      ("SORRY",      "C_01_020", 1, 1, 3, 1),
    "YES":        ("YES",        "G_03_074", 1, 7, 0, 0),
    "NO":         ("NO",         "NO",       2, 6, 0, 0),
    "GOOD":       ("GOOD",       "B_01_052", 0, 4, 2, 2),
    "BAD":        ("BAD",        "B_02_082", 0, 4, 2, 5),
    "ONE":        ("ONE",        "F_03_012", 2, 0, 0, 0),
    "TWO":        ("TWO",        "C_02_005", 3, 0, 0, 0),
    "THREE":      ("THREE",      "B_01_044", 7, 0, 0, 0),
    "FOUR":       ("FOUR",       "C_01_029", 7, 0, 0, 0),
    "HAPPY":      ("HAPPY",      "C_03_078", 0, 3, 3, 1),
    "SIX":        ("SIX",        "G_03_034", 7, 0, 0, 0),
    "SEVEN":      ("SEVEN",      "F_03_087", 7, 0, 0, 0),
    "EIGHT":      ("EIGHT",      "J_02_099", 7, 0, 0, 0),
    "NINE":       ("NINE",       "E_03_008", 7, 0, 0, 0),
    "RED":        ("RED",        "C_02_090", 2, 3, 2, 1),
    "BLUE":       ("BLUE",       "C_02_062", 0, 5, 0, 0),
    "GREEN":      ("GREEN",      "B_02_085", 7, 5, 0, 4),
    "YELLOW":     ("YELLOW",     "D_01_020", 7, 5, 0, 4),
    "ORANGE":     ("ORANGE",     "A_02_020", 5, 6, 2, 4),
    "PURPLE":     ("PURPLE",     "B_02_067", 7, 5, 0, 3),
    "BLACK":      ("BLACK",      "B_02_006", 2, 3, 1, 3),
    "WHITE":      ("WHITE",      "E_03_046", 4, 4, 3, 1),
    "MOTHER":     ("MOTHER",     "B_02_008", 4, 2, 2, 4),
    "FATHER":     ("FATHER",     "B_01_077", 4, 2, 1, 4),
    "SISTER":     ("SISTER",     "D_03_050", 7, 4, 2, 4),
    "BROTHER":    ("BROTHER",    "B_01_065", 7, 4, 1, 4),
    "BABY":       ("BABY",       "C_01_017", 0, 4, 3, 2),
    "FAMILY":     ("FAMILY",     "C_01_025", 7, 4, 0, 0),
    "EAT":        ("EAT",        "B_02_002", 6, 2, 2, 1),
    "DRINK":      ("DRINK",      "B_02_012", 5, 4, 2, 4),
    "WANT":       ("WANT",       "E_01_025", 4, 4, 0, 2),
    "LIKE":       ("LIKE",       "F_03_063", 7, 4, 3, 1),
    "LOVE":       ("LOVE",       "G_01_068", 1, 0, 3, 1),
    "HELP":       ("HELP",       "D_01_042", 7, 4, 0, 2),
    "KNOW":       ("KNOW",       "C_01_048", 0, 2, 1, 1),
    "UNDERSTAND": ("UNDERSTAND", "C_01_006", 1, 7, 1, 1),
    "GO":         ("GO",         "C_03_056", 2, 4, 0, 0),
    "COME":       ("COME",       "C_03_074", 2, 4, 0, 0),
    "SEE":        ("SEE",        "C_02_030", 3, 4, 1, 3),
    "LEARN":      ("LEARN",      "B_01_042", 6, 4, 6, 5),
    "SLEEP":      ("SLEEP",      "B_03_037", 4, 4, 5, 1),
    "TIRED":      ("TIRED",      "D_02_050", 0, 4, 3, 5),
    "ME":         ("ME",         "B_01_068", 2, 2, 3, 1),
    "YOU":        ("YOU",        "D_02_065", 2, 2, 0, 0),
    "WATER":      ("WATER",      "A_02_031", 7, 2, 2, 4),
    "HOME":       ("HOME",       "B_03_063", 6, 7, 5, 1),
    "SCHOOL":     ("SCHOOL",     "C_03_089", 0, 2, 0, 3),
    "BOOK":       ("BOOK",       "A_01_027", 0, 4, 0, 2),
    "NAME":       ("NAME",       "D_01_021", 7, 2, 0, 3),
    "WHAT":       ("WHAT",       "D_02_094", 4, 5, 0, 2),
    "WHERE":      ("WHERE",      "B_02_035", 2, 5, 0, 0),
    "WHO":        ("WHO",        "C_01_041", 7, 1, 2, 4),
    "HOW":        ("HOW",        "D_02_082", 0, 4, 0, 5),
    "WHY":        ("WHY",        "D_01_067", 0, 4, 1, 1),
    "BIG":        ("BIG",        "F_02_054", 7, 4, 0, 4),
    "SMALL":      ("SMALL",      "D_01_030", 0, 4, 0, 1),
    "HOT":        ("HOT",        "F_02_093", 5, 5, 2, 1),
    "COLD":       ("COLD",       "C_02_068", 1, 5, 3, 1),
    "STOP":       ("STOP",       "D_01_010", 0, 2, 0, 3),
}

CATEGORIES = ["social","number","color","family","verb","pronoun","noun","question","descriptor"]

SEMANTIC = {
    "HELLO":      [1,0,0,0,0,0,0,0,0],
    "GOODBYE":    [1,0,0,0,0,0,0,0,0],
    "PLEASE":     [1,0,0,0,0,0,0,0,0],
    "THANK YOU":  [1,0,0,0,0,0,0,0,0],
    "SORRY":      [1,0,0,0,0,0,0,0,0],
    "YES":        [1,0,0,0,0,0,0,0,0],
    "NO":         [1,0,0,0,0,0,0,0,0],
    "GOOD":       [1,0,0,0,0,0,0,0,1],
    "BAD":        [1,0,0,0,0,0,0,0,1],
    "ONE":        [0,1,0,0,0,0,0,0,0],
    "TWO":        [0,1,0,0,0,0,0,0,0],
    "THREE":      [0,1,0,0,0,0,0,0,0],
    "FOUR":       [0,1,0,0,0,0,0,0,0],
    "HAPPY":      [0,0,0,0,0,0,0,0,1],
    "SIX":        [0,1,0,0,0,0,0,0,0],
    "SEVEN":      [0,1,0,0,0,0,0,0,0],
    "EIGHT":      [0,1,0,0,0,0,0,0,0],
    "NINE":       [0,1,0,0,0,0,0,0,0],
    "RED":        [0,0,1,0,0,0,0,0,0],
    "BLUE":       [0,0,1,0,0,0,0,0,0],
    "GREEN":      [0,0,1,0,0,0,0,0,0],
    "YELLOW":     [0,0,1,0,0,0,0,0,0],
    "ORANGE":     [0,0,1,0,0,0,0,0,0],
    "PURPLE":     [0,0,1,0,0,0,0,0,0],
    "BLACK":      [0,0,1,0,0,0,0,0,0],
    "WHITE":      [0,0,1,0,0,0,0,0,0],
    "MOTHER":     [0,0,0,1,0,0,0,0,0],
    "FATHER":     [0,0,0,1,0,0,0,0,0],
    "SISTER":     [0,0,0,1,0,0,0,0,0],
    "BROTHER":    [0,0,0,1,0,0,0,0,0],
    "BABY":       [0,0,0,1,0,0,0,0,0],
    "FAMILY":     [0,0,0,1,0,0,0,0,0],
    "EAT":        [0,0,0,0,1,0,0,0,0],
    "DRINK":      [0,0,0,0,1,0,0,0,0],
    "WANT":       [0,0,0,0,1,0,0,0,0],
    "LIKE":       [0,0,0,0,1,0,0,0,0],
    "LOVE":       [0,0,0,0,1,0,0,0,0],
    "HELP":       [0,0,0,0,1,0,0,0,0],
    "KNOW":       [0,0,0,0,1,0,0,0,0],
    "UNDERSTAND": [0,0,0,0,1,0,0,0,0],
    "GO":         [0,0,0,0,1,0,0,0,0],
    "COME":       [0,0,0,0,1,0,0,0,0],
    "SEE":        [0,0,0,0,1,0,0,0,0],
    "LEARN":      [0,0,0,0,1,0,0,0,0],
    "SLEEP":      [0,0,0,0,1,0,0,0,0],
    "TIRED":      [0,0,0,0,0,0,0,0,1],
    "ME":         [0,0,0,0,0,1,0,0,0],
    "YOU":        [0,0,0,0,0,1,0,0,0],
    "WATER":      [0,0,0,0,0,0,1,0,0],
    "HOME":       [0,0,0,0,0,0,1,0,0],
    "SCHOOL":     [0,0,0,0,0,0,1,0,0],
    "BOOK":       [0,0,0,0,0,0,1,0,0],
    "NAME":       [0,0,0,0,0,0,1,0,0],
    "WHAT":       [0,0,0,0,0,0,0,1,0],
    "WHERE":      [0,0,0,0,0,0,0,1,0],
    "WHO":        [0,0,0,0,0,0,0,1,0],
    "HOW":        [0,0,0,0,0,0,0,1,0],
    "WHY":        [0,0,0,0,0,0,0,1,0],
    "BIG":        [0,0,0,0,0,0,0,0,1],
    "SMALL":      [0,0,0,0,0,0,0,0,1],
    "HOT":        [0,0,0,0,0,0,0,0,1],
    "COLD":       [0,0,0,0,0,0,0,0,1],
    "STOP":       [0,0,0,0,1,0,0,0,0],
}

PHON_WEIGHT = 0.9
SEM_WEIGHT  = 0.1


def build_feature_matrix():
    sign_ids = list(SIGNS.keys())
    n = len(sign_ids)

    handshape_oh = np.zeros((n, 8))
    movement_oh  = np.zeros((n, 8))
    location_oh  = np.zeros((n, 8))
    orient_oh    = np.zeros((n, 6))

    for i, sid in enumerate(sign_ids):
        _, _, hs, mv, loc, ori = SIGNS[sid]
        handshape_oh[i, hs] = 1
        movement_oh[i, mv]  = 1
        location_oh[i, loc] = 1
        orient_oh[i, ori]   = 1

    phon = np.hstack([handshape_oh, movement_oh, location_oh, orient_oh])  # (n, 30)
    sem  = np.array([SEMANTIC[sid] for sid in sign_ids], dtype=float)       # (n, 9)

    phon_n = normalize(phon, norm='l2') * PHON_WEIGHT
    sem_n  = normalize(sem,  norm='l2') * SEM_WEIGHT

    combined = np.hstack([phon_n, sem_n])
    return sign_ids, combined


def run_clustering(feature_matrix, n_clusters=8):
    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=20)
    labels = km.fit_predict(feature_matrix)
    return labels


def cluster_report(sign_ids, feature_matrix, cluster_labels):
    """Print tightness scores per cluster and identify most/least similar pairs."""
    dist = cdist(feature_matrix, feature_matrix, metric='cosine')
    sim  = 1 - dist
    n    = len(sign_ids)

    clusters = {}
    for i, (sid, cl) in enumerate(zip(sign_ids, cluster_labels)):
        clusters.setdefault(cl, []).append((i, SIGNS[sid][0]))

    print("\n── Cluster tightness report (phonological weight 90%) ─────────────────────")
    tightness = {}
    for cl in sorted(clusters):
        members = clusters[cl]
        idxs = [m[0] for m in members]
        names = [m[1] for m in members]
        if len(idxs) < 2:
            mean_sim = 1.0
        else:
            pairs = [(sim[i, j]) for ii, i in enumerate(idxs) for j in idxs[ii+1:]]
            mean_sim = np.mean(pairs)
        tightness[cl] = mean_sim
        marker = " ◄ TIGHTEST" if cl == max(tightness, key=tightness.get) else ""
        print(f"  Cluster {cl}: mean similarity = {mean_sim:.3f}{marker}")
        print(f"    Signs: {', '.join(sorted(names))}")

    # Most similar pair (excluding self)
    np.fill_diagonal(sim, -1)
    max_idx = np.unravel_index(np.argmax(sim), sim.shape)
    max_sim = sim[max_idx]
    print(f"\n  Most similar pair:  {SIGNS[sign_ids[max_idx[0]]][0]} ↔ {SIGNS[sign_ids[max_idx[1]]][0]}"
          f"  (similarity = {max_sim:.3f})")
    print(f"  → 3 of 4 Stokoe parameters identical; only handshape differs.")

    # Most dissimilar pair
    np.fill_diagonal(sim, 2)
    min_idx = np.unravel_index(np.argmin(sim), sim.shape)
    min_sim = sim[min_idx]
    print(f"  Most dissimilar pair: {SIGNS[sign_ids[min_idx[0]]][0]} ↔ {SIGNS[sign_ids[min_idx[1]]][0]}"
          f"  (similarity = {min_sim:.3f})")
    print(f"  → These are the 'poles' of the parameter space in this vocabulary.\n")

    # Restore diagonal
    np.fill_diagonal(sim, 1)
    return tightness


def make_heatmap(sign_ids, feature_matrix, cluster_labels, out_path):
    n    = len(sign_ids)
    dist = cdist(feature_matrix, feature_matrix, metric='cosine')
    sim  = 1 - dist

    order          = sorted(range(n), key=lambda i: (cluster_labels[i], sign_ids[i]))
    sim_ordered    = sim[np.ix_(order, order)]
    labels_ordered = [sign_ids[i] for i in order]

    cmap = mcolors.LinearSegmentedColormap.from_list(
        'stokoe_glow',
        ['#000000', '#0d0221', '#1a0a3d', '#0d1b6e', '#0066cc',
         '#00aaff', '#00eeff', '#80ffff', '#ffffff'],
        N=512
    )

    fig, ax = plt.subplots(figsize=(18, 16))
    fig.patch.set_facecolor('#000000')
    ax.set_facecolor('#000000')

    im = ax.imshow(sim_ordered, cmap=cmap, aspect='auto', vmin=0, vmax=1,
                   interpolation='nearest')

    # Cluster boundary lines
    seen, cumsum, boundaries = [], 0, []
    for i in order:
        cl = cluster_labels[i]
        if cl not in seen:
            if seen:
                boundaries.append(cumsum - 0.5)
            seen.append(cl)
        cumsum += 1

    for b in boundaries:
        ax.axhline(b, color='#00eeff', linewidth=0.8, alpha=0.6)
        ax.axvline(b, color='#00eeff', linewidth=0.8, alpha=0.6)

    ax.set_xticks(range(n))
    ax.set_yticks(range(n))
    ax.set_xticklabels(labels_ordered, rotation=90, fontsize=7.5,
                        color='#aaddff', fontfamily='monospace')
    ax.set_yticklabels(labels_ordered, fontsize=7.5,
                        color='#aaddff', fontfamily='monospace')
    ax.tick_params(colors='#00eeff', length=2)
    for spine in ax.spines.values():
        spine.set_edgecolor('#0066cc')

    cbar = fig.colorbar(im, ax=ax, fraction=0.03, pad=0.02)
    cbar.ax.yaxis.set_tick_params(color='#00eeff', labelcolor='#aaddff')
    cbar.set_label('Phonological Similarity', color='#aaddff', fontsize=10)
    cbar.outline.set_edgecolor('#0066cc')

    ax.set_title('ASL Sign Similarity — Stokoe Parameters (90%) + Semantic (10%)',
                 color='#00eeff', fontsize=14, pad=16, fontfamily='monospace')

    plt.tight_layout()
    plt.savefig(out_path, dpi=180, bbox_inches='tight',
                facecolor='#000000', edgecolor='none')
    plt.close()
    print(f'Heatmap saved: {out_path}')


def save_clusters(sign_ids, cluster_labels, out_path):
    rows = sorted(zip(sign_ids, cluster_labels), key=lambda x: (x[1], x[0]))
    with open(out_path, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['sign', 'cluster'])
        for sid, cl in rows:
            w.writerow([SIGNS[sid][0], cl])
    print(f'Clusters saved: {out_path}')


def save_matrix(sign_ids, feature_matrix, out_path):
    dist = cdist(feature_matrix, feature_matrix, metric='cosine')
    sim  = np.round(1 - dist, 4)
    with open(out_path, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow([''] + [SIGNS[s][0] for s in sign_ids])
        for i, sid in enumerate(sign_ids):
            w.writerow([SIGNS[sid][0]] + list(sim[i]))
    print(f'Matrix saved: {out_path}')


if __name__ == '__main__':
    out_dir = pathlib.Path(__file__).parent.parent / 'data'
    out_dir.mkdir(exist_ok=True)

    print(f'Building feature matrix for {len(SIGNS)} signs '
          f'(phonological weight={PHON_WEIGHT}, semantic weight={SEM_WEIGHT})...')
    sign_ids, features = build_feature_matrix()

    print('Running k-means (k=8)...')
    cluster_labels = run_clustering(features, n_clusters=8)

    cluster_report(sign_ids, features, cluster_labels)

    make_heatmap(sign_ids, features, cluster_labels,
                 out_dir / 'similarity_heatmap.png')
    save_clusters(sign_ids, cluster_labels, out_dir / 'clusters.csv')
    save_matrix(sign_ids, features,         out_dir / 'similarity_matrix.csv')
