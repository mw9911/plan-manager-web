// 파일명: tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 💡 src 폴더 내의 모든 React 컴포넌트를 스캔하도록 추가
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}