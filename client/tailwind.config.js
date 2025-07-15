/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#E63946',      // Passionate Red — emotional, energetic
        secondary: '#F1FAEE',    // Soft White — clean, minimal background
        accent: '#A8DADC',       // Calm Teal — friendly and trustworthy contrast
        dark: '#1D3557',         // Deep Navy — strong, stable for text and headers
        muted: '#457B9D',        // Muted Blue — subtle secondary UI elements
        background: '#FFFFFF',   // Default background color
        success: '#38B000',      // Green for verification, matches, etc.
        warning: '#FFBA08',      // Gold for soft alerts
        danger: '#D00000'        // Strong red for destructive actions (e.g., report, block)
      }
      
    },
  },
  plugins: [],
}