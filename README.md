# 🍪 Cookie Counter App

A simple and fun cookie counter app built with Next.js and Tailwind CSS.
It now includes an experimental AI backend to analyze cookie menus and trays.

## Features

- Click to collect cookies
- Beautiful gradient background
- Responsive design
- Cookie count display
- Reset functionality
- Analyze cookie menus with GPT-4o
- Count cookies on trays using AI

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

To enable AI analysis you also need to run the Fastify API server:

```bash
npm run server
```

Create a `.env` file based on `.env.example` and set your `OPENAI_API_KEY`.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Built With

- [Next.js 15](https://nextjs.org/) - React framework
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## How to Play

1. Click the "Get Cookie! 🍪" button to collect cookies
2. Watch your cookie count increase
3. Use the "Reset Cookies" button to start over

Enjoy collecting cookies! 🍪

You can also visit `/menu` to analyze a cookie menu, `/tray` to upload tray
photos for counting, and `/analytics` to view stats.
