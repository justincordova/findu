const GRADIENT = [
  "#C9A9FF", // soft lavender
  "#B28DFF", // pastel purple
  "#A678FF", // mid lavender
  "#9F6BFF", // slightly deeper
  "#B56DFF", // pinkish violet for balance
] as const;

const PRIMARY = "#A855F7"; // Main Purple (matches your button color)
const SECONDARY = "#E9D5FF"; // Soft Lavender (for borders, secondary UI)
const ACCENT = "#9333EA"; // Deeper Violet (strong CTA / highlights)
const DARK = "#1E1E1E"; // Neutral dark for text
const MUTED = "#6B7280"; // Muted gray for secondary text
const BACKGROUND = "#F5F3FF"; // Very light lavender background
const SUCCESS = "#4ADE80"; // Fresh green
const WARNING = "#FACC15"; // Warm yellow
const DANGER = "#EF4444"; // Softer red

export const theme = {
  colors: {
    primary: PRIMARY,
    secondary: SECONDARY,
    accent: ACCENT,
    text: DARK,
    textSecondary: MUTED,
    background: BACKGROUND,
    surface: SECONDARY,
    error: DANGER,
    success: SUCCESS,
    warning: WARNING,
    skeleton: "#E5E5EA",
    border: "#D4D4D4",
    messageOtherBg: "#E5E5EA",
    unreadBg: "rgba(168, 85, 247, 0.05)",
  },
  gradient: GRADIENT,
};

// Export individual colors for backward compatibility
export {
  ACCENT,
  BACKGROUND,
  DANGER,
  DARK,
  GRADIENT,
  MUTED,
  PRIMARY,
  SECONDARY,
  SUCCESS,
  WARNING,
};

// Additional backward-compatible exports
export const TEXT_PRIMARY = DARK;
export const TEXT_SECONDARY = MUTED;

// export const GRADIENT = [
//   "#FFD4D9", // very light peach
//   "#FFB3BC", // light peach
//   "#FF919E", // mid peach
//   "#FF6F81", // deeper peach
//   "#BB8588", // Peach Blossom (main)
// ] as const;

// export const PRIMARY = "#BB8588";      // Peach Blossom (main button color)
// export const SECONDARY = "#D8A48F";    // Rose Blush (secondary UI elements)
// export const ACCENT = "#D7CE93";       // Golden Clover (highlights / accents)
// export const DARK = "#A3A380";         // Olive Petal (dark neutral for text)
// export const MUTED = "#EFEBCE";        // Artic Daisy (muted / background elements)
// export const BACKGROUND = "#EFEBCE";   // Artic Daisy (main background)
// export const SUCCESS = "#D7CE93";      // Golden Clover (success state)
// export const WARNING = "#D8A48F";      // Rose Blush (warning state)
// export const DANGER = "#BB8588";       // Peach Blossom (error / danger)
