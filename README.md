# VastuPrakash (Smart Vastu Analysis System)

A modern, offline-first React application for analyzing the Vastu Shastra alignment of house floor plans. Features an interactive drawing grid, SVG report generation, and AI-powered floor plan detection using the Google Gemini API.

## Core Features

1. **Interactive Layout Drawer**: Canvas-based 2D tool to plot your own floor plan, assign zones, and trace your 3x3 Vastu Mandala (Brahmasthana checking).
2. **AI Image Detection (Gemini 2.5 Flash)**: Upload any image of a floor plan, and the AI automatically assigns dimensions and detects room classifications directly in the browser. 
3. **Manual Vastu Assignment**: If you don't have a floor plan, you can rapidly assign rooms to grid zones using a pure UI approach.
4. **Vastu Reporting Engine**: Get a composite Vastu Score (out of 100), customized architectural advice per-room, and printable structural remedies.

## Security & GitHub Deployment
**Is this safe to upload to GitHub? YES.**

This project is inherently safe to push to GitHub (including public repositories) and deploy immediately on static hosts like GitHub Pages or Vercel. 
- **No Hardcoded Keys**: The `gemini-2.5-flash` API key is **never** hardcoded into any source file.
- **No Environment Variables Needed**: Because this is a static Single Page Application (SPA), baking API keys into a `.env` file would expose them to the public in your distribution build (`dist/index.js`). 
- **Local Storage Architecture**: Instead, the application requires the user to click the **Settings ⚙️** icon in the app and type their own API Key. It is securely saved in their browser's local `localStorage` and sent directly to Google from the client-side. This ensures API limits and billing are safely contained per user.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173`. Click the top-right Settings Gear icon to input your Gemini API Key and unlock the "AI Detect" tab!

## Tech Stack
- **Framework**: Vite + React 18
- **Styling**: TailwindCSS 
- **Icons**: Lucide React
- **AI Engine**: Google Gemini API (`gemini-2.5-flash` via REST Endpoint)
