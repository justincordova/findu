const theme = require("./constants/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: theme.PRIMARY,
        secondary: theme.SECONDARY,
        accent: theme.ACCENT,
        dark: theme.DARK,
        muted: theme.MUTED,
        background: theme.BACKGROUND,
        success: theme.SUCCESS,
        warning: theme.WARNING,
        danger: theme.DANGER,
        gradient: theme.GRADIENT, // Use shared gradient
      },
    },
  },
  plugins: [],
};
