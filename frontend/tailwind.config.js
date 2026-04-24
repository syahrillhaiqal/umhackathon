const tailwindConfig = {
    darkMode: "class",
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                display: ["'Space Grotesk'", "sans-serif"],
                body: ["'Manrope'", "sans-serif"],
            },
            colors: {
                shell: "var(--shell)",
                panel: "var(--panel)",
                text: "var(--text)",
                accent: "var(--accent)",
                danger: "var(--danger)",
                warning: "var(--warning)",
                success: "var(--success)",
            },
        },
    },
    plugins: [],
};

export default tailwindConfig;
