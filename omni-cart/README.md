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
- [New Features](#new-features)
- [Project Structure](#project-structure)

---

## Overview

Omni-Cart has two surfaces that work together:

| Surface | What it does |
|---|---|
| **Chrome Extension** | Scans the active browser tab (YouTube video, article, or image), extracts frames or text, and sends them to the AI backend for component extraction. |
| **Web Dashboard** | Receives the extracted parts list, checks for voltage conflicts, scrapes live pricing from Shopee and Lazada, maps local suppliers, and surfaces related YouTube tutorials and articles. |

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
    │  sendMessage({ sourceType, data, sourceTitle })
    ▼
ExtensionDashboard.jsx
    │  POST /analyze-parts
    ▼
Netlify Functions
    ├── analyze-parts.js        → Gemini AI → { components, optimized_maps_query }
    ├── scrape-prices.js        → Shopee / Lazada pricing
    └── fetch-inspiration.js   → YouTube Data API v3 + Google CSE → { videos, articles }

Web Dashboard (React + Vite + Tailwind)
    └── BuildContext.jsx        → single source of truth for all dashboard state
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
  - [Google Maps Platform](https://console.cloud.google.com/) — Google Maps Integration
  - [Google Custom Search Engine](https://programmablesearchengine.google.com/) *(optional)* — article results in the inspiration carousel

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

# Google Custom Search Engine — used by fetch-inspiration.js for article results (optional)
# If omitted, the carousel will still show YouTube videos; the articles column will be empty.
GOOGLE_CSE_API_KEY=your_cse_api_key_here
GOOGLE_CSE_CX=your_cse_cx_id_here

# Web Dashboard URL — used by the Chrome Extension to open the dashboard tab
VITE_WEB_DASHBOARD_URL=http://localhost:8888/
```

> **Security note:** All server-side keys (`GEMINI_API_KEY`, `YOUTUBE_API_KEY`, `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_CX`) are read exclusively by Netlify serverless functions via `process.env`. They are never bundled into the frontend JavaScript.

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

- **Drag-and-drop or click** to upload a schematic image (`.png`, `.jpg`), PDF, or **Tinkercad/EAGLE `.brd` file**.
- `.brd` files are parsed **entirely client-side** — no AI call is made. The XML `<elements>` tree is walked and each `<element>` is resolved to a human-readable label using its `value` attribute plus type inference (package-attribute pattern matching and EDA reference-designator prefix lookup). A Tinkercad LED circuit export, for example, yields entries like "9V Battery", "RED LED", and "1k Resistor".
- Images and PDFs are sent to Gemini AI for extraction.
- Alternatively, import a build shared from the extension via URL.

#### Anti-Fry Matrix (Voltage Builder)

- Review your active build's component slots.
- The system automatically detects voltage conflicts between 5V and 3.3V-only devices (e.g., a 3.3V sensor on a 5V I²C bus).
- **Educational Tutor callout** — every detected conflict now shows a contextual ⚡ **Tutor** explanation above the physics note, with three severity branches based on the voltage delta:
  - **≥ 1.5 V** → `OVERVOLTAGE` — permanent damage warning, names both devices and their voltages.
  - **0.5 V – 1.5 V** → `UNDERDRIVEN LOGIC` — no damage, but unreliable communication.
  - **< 0.5 V** → borderline mismatch, soft production caution.
- Accept the suggested safe alternative (a 4-channel bidirectional logic level shifter) to resolve the conflict.

#### E-Commerce Aggregator

- View live scraped prices from **Shopee** and **Lazada** for every component in your build.
- Filter by store and sort by price, sales, or review score.
- The **Related Tutorials & Inspiration** carousel at the top shows a mix of **Video** and **Article** cards fetched dynamically from YouTube Data API v3 and Google Custom Search in parallel.
  - When a build was imported from the Chrome Extension, the carousel uses the **source page title** as a Tier-1 query (`DIY <sourceTitle> tutorial`) for more targeted results.
  - Without a source title, it falls back to a Tier-2 query built from the top two component names.
  - While loading, the carousel shows **shimmer skeleton cards** that match the card geometry.
  - Each card is badged **Video** or **Article** and links directly to the YouTube video or article URL.
  - If `GOOGLE_CSE_API_KEY` / `GOOGLE_CSE_CX` are not set, the function gracefully returns an empty articles array and only videos are shown.

#### Procurement Metrics

- See a cost breakdown, store distribution chart, and total estimated build cost in PHP.
- Click **Generate PDF Invoice** to open the invoice modal, then **Download PNG** to save a crisp 2× scaled invoice image directly to disk — no external dependencies, drawn entirely on an HTML `<canvas>`. The file is saved as `<buildName>-invoice.png`.

#### Saved Builds Archive

- Save your current build to the archive with one click (**Save to Archive** in the sidebar).
- Load, rename, duplicate, or delete saved builds.
- Each archived build stores its full component list and voltage slot configuration.

---

## New Features

### Phase 1 — Tinkercad / EAGLE `.brd` Uploader

`IngestionView.jsx` now accepts `.brd` (EAGLE/KiCad XML) files alongside images and PDFs. Parsing is done entirely in the browser using `DOMParser` — no network call is made:

1. Every `<elements> > <element>` node is read.
2. The `value` attribute is combined with a type inferred from:
   - **Package-attribute pattern matching** — e.g. `RESAD` → Resistor, `LEDRD` → LED, `BATTERY` → Battery.
   - **EDA reference-designator prefix lookup** — e.g. `R1` → Resistor, `C3` → Capacitor, `BAT1` → Battery, `U2` → IC.
3. Identical labels are tallied into quantities.
4. The resulting component list is piped directly into `importCart`, skipping the Gemini AI call entirely.

Supported file input: `.png`, `.jpg`, `.jpeg`, `.pdf`, `.brd`.

---

### Phase 2 — Invoice PNG Download

The QR code invoice approach was replaced with a native canvas renderer. `ProcurementMetricsView.jsx` exposes a `renderInvoiceCanvas()` function that draws a complete invoice onto an HTML `<canvas>` at 2× pixel density with zero external dependencies:

- Header: "Omni-Cart — Invoice", build name, timestamp.
- Line-item rows with quantity, per-item price, and row separators.
- TOTAL section in large bold text.

Clicking **Download PNG** in the invoice modal triggers `canvas.toDataURL` and an `<a download>` save, naming the file `<buildName>-invoice.png`.

---

### Phase 3 — Educational Voltage Tutor

`voltageAnalysis.js` — `detectVoltageConflict()` now builds a `reason` string from the actual computed voltage values and the direction of the mismatch (which device is higher, which is lower). Three branches:

| Delta | Label | Meaning |
|---|---|---|
| ≥ 1.5 V | `OVERVOLTAGE` | Permanent pin damage; level shifter required |
| 0.5 V – 1.5 V | `UNDERDRIVEN LOGIC` | No damage but missed bits; shifter recommended |
| < 0.5 V | Borderline mismatch | Soft caution for production use |

`AntiFryMatrixView.jsx` — the `ConflictResolutionPanel` renders the `reason` text inside a highlighted ⚡ **Tutor** callout box. The physics explanation is demoted to smaller muted secondary text below.

---

### Phase 4 — Two-Tier Contextual Inspiration Carousel

**Extension → context → API → UI chain:**

- The Chrome Extension passes `sourceTitle` (the page title of the scanned tab) alongside the components when importing into the dashboard.
- `BuildContext.jsx` stores `sourceTitle` and uses it in `refreshInspiration()` to build the query.

**Tier-1 / Tier-2 query construction (`BuildContext.refreshInspiration`):**

| Tier | Condition | Query |
|---|---|---|
| Tier 1 | `sourceTitle` is present | `DIY <sourceTitle> tutorial` |
| Tier 2 | No source title | `DIY <component1> <component2> project tutorial` |

**`fetch-inspiration.js` (Netlify function):**

- Queries YouTube Data API v3 and Google Custom Search Engine **in parallel** using `Promise.allSettled`.
- Returns `{ videos, articles }` — each source degrades independently; if CSE keys are absent the articles array is simply empty.

**`EcommerceInspirationView.jsx` carousel:**

- Mixes **Video** and **Article** cards with store-badge style type labels.
- Loading state uses geometry-matched shimmer skeleton cards (no layout shift).
- When Tier-1 fires, a caption below the carousel header shows: *Contextual search from source page: "<sourceTitle>"*.

---

## Project Structure

```
omni-cart/
├── netlify/
│   └── functions/
│       ├── analyze-parts.js       # Gemini AI component extraction
│       ├── scrape-prices.js       # Shopee / Lazada price estimator
│       └── fetch-inspiration.js   # YouTube Data API v3 + Google CSE tutorial & article fetcher
├── public/
│   ├── background.js              # Chrome Extension service worker & router
│   ├── videoFetcher.js            # Injected content script — YouTube frame capture
│   ├── domFetcher.js              # Injected content script — article/DOM text extraction
│   ├── manifest.json              # Chrome Extension Manifest V3 config
│   └── sandbox.html               # Sandboxed iframe for Google Maps supplier search
├── src/
│   ├── context/
│   │   └── BuildContext.jsx       # Global state: build slots, scrape, inspiration, sourceTitle
│   ├── views/
│   │   ├── IngestionView.jsx      # File upload (.png/.jpg/.pdf/.brd) + BRD client-side parser
│   │   ├── AntiFryMatrixView.jsx  # Voltage conflict checker + ⚡ Tutor callout
│   │   ├── EcommerceInspirationView.jsx  # Live pricing + mixed Video/Article carousel
│   │   ├── ProcurementMetricsView.jsx    # Cost analytics + canvas invoice PNG download
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
│   ├── utils/
│   │   ├── voltageAnalysis.js     # Voltage inference, conflict detection + reason builder
│   │   ├── importBridge.js        # URL import serialisation helpers
│   │   └── savedBuildsStorage.js  # localStorage build archive helpers
│   ├── App.jsx                    # Extension vs Dashboard render gate
│   └── ExtensionDashboard.jsx     # Extension popup root
├── .env                           # API keys (not committed — create manually)
├── netlify.toml                   # Netlify headers & CSP config
├── package.json
└── vite.config.js
```
