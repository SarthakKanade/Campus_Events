export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                background: 'rgb(var(--bg-background) / <alpha-value>)',
                surface: 'rgb(var(--bg-surface) / <alpha-value>)',
                primary: 'rgb(var(--color-primary) / <alpha-value>)',
                secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
                accent: 'rgb(var(--color-accent) / <alpha-value>)',
                text: 'rgb(var(--color-text) / <alpha-value>)',
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
                heading: ['Fredoka', 'sans-serif'],
            },
            boxShadow: {
                'chill': '4px 4px 0px 0px rgba(0,0,0,1)',
                'neon': '0 0 10px rgb(var(--color-primary)), 0 0 20px rgb(var(--color-primary))',
            },
        },
    },
    plugins: [],
}

