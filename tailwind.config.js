/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'london-fog': '#FBF9F3',
        'rich-black': '#2D2D2D',
        'tast-pink': '#F05881',
        'tast-red': '#EF4056',
        'tast-light-pink': '#F287B7',
        'tast-mauve': '#A12F52',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        serif: ['Times New Roman', 'Times', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        handwritten: ['var(--font-handwritten)', 'cursive'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'fade-in': 'fade-in 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};
