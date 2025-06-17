/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        neon: "0 0 5px rgba(255, 0, 255, 0.7), 0 0 10px rgba(0, 255, 255, 0.7)",
        "neon-lg":
          "0 0 15px rgba(255, 0, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.8)",
        "neon-fuchsia": "0 0 20px rgba(255, 0, 255, 0.9)",
        "neon-button":
          "0 0 10px rgba(255, 0, 255, 0.7), 0 0 20px rgba(0, 255, 255, 0.7)",
        "neon-inner":
          "inset 0 0 10px rgba(255, 0, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.5)",
        "neon-sm":
          "0 0 8px rgba(255, 0, 255, 0.6), 0 0 15px rgba(0, 255, 255, 0.6)",
      },
    },
  },
  plugins: [],
};
