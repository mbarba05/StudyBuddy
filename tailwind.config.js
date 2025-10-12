/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}", // entry file
        "./app/**/*.{js,jsx,ts,tsx}", // everything inside /app
        "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: { extend: {} },
    plugins: [],
};
