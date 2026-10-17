// Site tokens (src/styles/_tokens.scss) plus the video's own sizes.

export const color = {
  paper: "#F2EFE9",
  paper2: "#E9E5DD",
  paper3: "#E4E0D8",
  paperRaised: "#F7F5F1",
  ink: "#151515",
  ink2: "#3A3732",
  ink3: "#5E5A53",
  ink4: "#A8A399",
  accent: "#E0502E",
  onAccent: "#151515",
  /** Logo's own colours (not the site accent). */
  logoDot: "#F48157",
  logoWave: "#FBF172",
  logoInk: "#231F27",
  logoGrey: "#555358",
  /** Instagram avatar gradient and lattice. */
  avatarLeft: "#FF7C4F",
  avatarRight: "#F8EE68",
  avatarLine: "#E6AD42",
} as const;

/** Dark theme — only the opening of Promo (P1). */
export const dark = {
  paper: "#141413",
  line: "#EFEAE2",
  imgFilter: "brightness(.88) contrast(1.04)",
} as const;

export const shadow = {
  /** The one picture shadow; `k` scales it for a smaller or larger picture. */
  float: (k = 1) => `0 ${40 * k}px ${80 * k}px ${-30 * k}px rgba(21,21,21,.45)`,
} as const;

/** Line weight of the drawings. */
export const stroke = { reels: 3, promo: 2.5 } as const;

/** Type scale per format (brief 5.2). */
export const type = {
  reels: { hero: 300, large: 84, medium: 64, quote: 56, lede: 40, label: 26, text: 30 },
  promo: { hero: 300, large: 96, medium: 56, quote: 52, lede: 44, label: 20, text: 22 },
} as const;

/** Picture scale limit vs its natural size (brief 5.4). */
export const ART_SCALE_LIMIT = 1.1;
/** In fast montages (picture on screen ≤ 0.3 s). */
export const ART_SCALE_LIMIT_FAST = 1.25;

/** Reels: Meta overlays — text and logo only inside this box (brief 5.7). */
export const REELS_SAFE = { x0: 65, x1: 1015, y0: 270, y1: 1250 } as const;
/** Promo: text at least this far from the edges. */
export const PROMO_MARGIN = 96;
