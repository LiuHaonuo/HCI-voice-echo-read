/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 极其重要：这句话指挥 Tailwind 去扫描 src 下所有成员写的界面文件
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}