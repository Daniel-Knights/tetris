/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "rgb(30 36 36 / <alpha-value>)",
        secondary: "rgb(172 184 162 / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
