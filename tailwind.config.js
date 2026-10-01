/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        body: ['"DM Sans"', "sans-serif"]
      },
      colors: {
        ink: "#202925",
        paper: "#f6f7f1",
        leaf: "#c8ef67",
        forest: "#526b3a",
        coral: "#f1896b"
      },
      boxShadow: {
        quiet: "0 8px 28px rgba(35, 49, 31, .07)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
