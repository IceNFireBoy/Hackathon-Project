# Omni-Cart

A context-aware Chrome Extension and Web Dashboard that turns maker inspiration — YouTube tutorials, articles, and images — into a structured electronics parts list with live pricing, voltage safety checks, and local supplier mapping.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Loading the Chrome Extension](#loading-the-chrome-extension)
- [How to Use](#how-to-use)
- [Project Structure](#project-structure)

---

## Overview

Omni-Cart has two surfaces that work together:

| Surface | What it does |
|---|---|
| **Chrome Extension** | Scans the active browser tab (YouTube video, article, or image), extracts frames or text, and sends them to the AI backend for component extraction. |
| **Web Dashboard** | Receives the extracted parts list, checks for voltage conflicts, scrapes live pricing from Shopee and Lazada, maps local suppliers, and surfaces related YouTube tutorials. |

---

## Architecture

```
Chrome Extension (popup)
    │  START_OMNI_SCAN message
    ▼
background.js (router)
    │  injects videoFetcher.js or domFetcher.js into active tab
    ▼
Content Script (videoFetcher.js / domFetcher.js)
    │  sendMessage({ sourceType, data })
    ▼
ExtensionDashboard.jsx
    │  POST /analyze-parts
    ▼
Netlify Functions
    ├── analyze-parts.js   → Gemini AI → { components, optimized_maps_query }
    ├── scrape-prices.js   → Shopee / Lazada pricing
    └── fetch-inspiration.js → YouTube Data API v3 → related tutorials

Web Dashboard (React + Vite + Tailwind)
    └── BuildContext.jsx   → single source of truth for all dashboard state
```

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **Netlify CLI** (for running serverless functions locally)
- A **Google Chrome** browser (for the extension)
- API keys for:
  - [Google Gemini](https://aistudio.google.com/apikey) — component extraction AI
  - [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com) — related tutorial cards

---

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Component-Tracker-Extension/omni-cart
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install the Netlify CLI globally (if not already installed)

```bash
npm install -g netlify-cli
```

---

## Environment Variables

Create a `.env` file in the `omni-cart/` directory with the following keys:

```env
# Google Gemini AI — used by analyze-parts.js
GEMINI_API_KEY=your_gemini_api_key_here

# YouTube Data API v3 — used by fetch-inspiration.js (server-side only, never exposed to the browser)
YOUTUBE_API_KEY=your_youtube_api_key_here
```

> **Security note:** Both keys are read exclusively by Netlify serverless functions via `process.env`. They are never bundled into the frontend JavaScript.

---

## Running Locally

Omni-Cart's serverless functions require the Netlify CLI dev server to run alongside Vite. Use a single command:

```bash
netlify dev
```

This starts:
- The **Vite dev server** (React frontend) on `http://localhost:5173`
- The **Netlify Functions** proxy on `http://localhost:8888`

The dashboard is accessible at **`http://localhost:8888`**.

> The `API_BASE_URL` in `src/hooks/useAnalyzeParts.js` is pre-configured to point to `http://localhost:8888/.netlify/functions` when `isLocal = true`.

---

## Loading the Chrome Extension

The extension popup is the same React app — it renders differently based on whether `chrome.runtime.id` is present (see `src/App.jsx`).

### Step 1 — Build the extension bundle

```bash
npm run build
```

This outputs the compiled assets into the `dist/` folder.

### Step 2 — Load into Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `omni-cart/dist/` folder

The **Omni-Cart** extension icon will appear in your Chrome toolbar.

### Step 3 — Point the extension at your running dashboard

When the extension opens a web dashboard tab, it uses the `VITE_WEB_DASHBOARD_URL` environment variable (defaults to `http://localhost:8888/`). Set this in `.env` if your dashboard is deployed elsewhere:

```env
VITE_WEB_DASHBOARD_URL=https://your-netlify-site.netlify.app/
```

---

## How to Use

### Using the Chrome Extension

1. Navigate to a **YouTube tutorial** (`youtube.com/watch` or `youtube.com/shorts`) or any **maker article** with a list of components.
2. Click the **Omni-Cart** icon in your Chrome toolbar.
3. The extension automatically scans the page:
   - On YouTube: captures 4 video frames over 6 seconds and sends them to Gemini AI.
   - On articles: extracts the page text and sends it to Gemini AI.
4. Wait for the **"Verification Sandbox"** status — your extracted parts list will appear.
5. Review the **Ready for Cart** and **Unsure Components** sections:
   - Check/uncheck items to include or exclude them.
   - Edit component names inline in the Unsure section.
6. Use **Find Locally** to open the sandbox map and locate nearby electronics suppliers.
7. Click **Open in Web Dashboard** to export your verified parts list to the full dashboard.

---

### Using the Web Dashboard

Navigate to `http://localhost:8888` (or your deployed URL via the extension "Open in Web Dashboard").

#### Ingestion
- Paste an article, tutorial description, or component list into the text area.
- Click **Analyze** to extract components using Gemini AI.
- Alternatively, import a build shared from the extension via URL.

#### Anti-Fry Matrix (Voltage Builder)
- Review your active build's component slots.
- The system automatically detects voltage conflicts (e.g., 3.3V sensor on a 5V I²C bus).
- Accept the suggested safe alternative to resolve a conflict.

#### E-Commerce Aggregator
- View live scraped prices from **Shopee** and **Lazada** for every component in your build.
- Filter by store and sort by price, sales, or review score.
- The **Related Tutorials & Inspiration** carousel at the top shows real YouTube videos fetched dynamically based on your active build's components.
- Click any tutorial card to open it directly on YouTube.

#### Procurement Metrics
- See a cost breakdown, store distribution chart, and total estimated build cost in PHP.

#### Saved Builds Archive
- Save your current build to the archive with one click (**Save to Archive** in the sidebar).
- Load, rename, duplicate, or delete saved builds.
- Each archived build stores its full component list and voltage slot configuration.

---

## Project Structure

```
omni-cart/
├── netlify/
│   └── functions/
│       ├── analyze-parts.js       # Gemini AI component extraction
│       ├── scrape-prices.js       # Shopee / Lazada price estimator
│       └── fetch-inspiration.js   # YouTube Data API v3 tutorial fetcher
├── public/
│   ├── background.js              # Chrome Extension service worker & router
│   ├── videoFetcher.js            # Injected content script — YouTube frame capture
│   ├── domFetcher.js              # Injected content script — article/DOM text extraction
│   ├── manifest.json              # Chrome Extension Manifest V3 config
│   └── sandbox.html              # Sandboxed iframe for Google Maps supplier search
├── src/
│   ├── context/
│   │   └── BuildContext.jsx       # Global state: build slots, scrape, inspiration
│   ├── views/
│   │   ├── IngestionView.jsx      # Text / URL import
│   │   ├── AntiFryMatrixView.jsx  # Voltage conflict checker
│   │   ├── EcommerceInspirationView.jsx  # Live pricing + YouTube carousel
│   │   ├── ProcurementMetricsView.jsx    # Cost analytics
│   │   └── SavedBuildsView.jsx    # Build archive
│   ├── components/
│   │   ├── extension.jsx          # Extension popup UI components
│   │   ├── dashboard.jsx          # Dashboard shared components
│   │   └── ui.jsx                 # Base UI primitives (Button, Card, Badge, etc.)
│   ├── hooks/
│   │   ├── useAnalyzeParts.js     # API_BASE_URL + analyze-parts fetch hook
│   │   └── usePricingFromContext.js
│   ├── layouts/
│   │   └── DashboardShell.jsx     # Sidebar nav + view router
│   ├── App.jsx                    # Extension vs Dashboard render gate
│   └── ExtensionDashboard.jsx     # Extension popup root
├── .env                           # API keys (not committed — create manually)
├── netlify.toml                   # Netlify headers & CSP config
├── package.json
└── vite.config.js
```