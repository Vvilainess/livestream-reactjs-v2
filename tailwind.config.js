/** @type {import('tailwindcss').Config} */
export default {
  // CONFIGURATION QUAN TRỌNG: Khai báo Tailwind cần quét những file nào
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Đảm bảo quét tất cả file React/JSX/TSX
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
