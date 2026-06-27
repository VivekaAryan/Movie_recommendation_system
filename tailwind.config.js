module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          canvas: "#ede8e2",
          surface: "#f3efe9",
          border: "#d4ccc2",
          muted: "#6b645c",
          text: "#3a3530",
          lilac: "#ddd0ed",
          "lilac-deep": "#8f7aad",
          sky: "#c8dde9",
          "sky-deep": "#5a8aad",
          blush: "#edd8dc",
          "blush-deep": "#b87d88",
          sage: "#cdded3",
          "sage-deep": "#5f9170",
          peach: "#f0ddd0",
          "peach-deep": "#b8895e",
          match: "#4a6678",
        },
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
