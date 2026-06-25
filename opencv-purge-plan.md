# Video Fetcher Consolidation Plan

## Top-Level Overview

**Goal:** Consolidate `youtubeFetcher.js` and `shortsFetcher.js` into a single universal `videoFetcher.js`. Both scripts now do exactly the same thing (HTML5 Canvas frame extraction), so maintaining two files violates DRY. The OpenCV-dependent files (`youtubeFetcher.js`, `opencv.js`) are dead weight and must be deleted. The background router must be updated to point all YouTube routes at the single new file.

**Scope:** Three files modified/created, two deleted:
- `omni-cart/public/shortsFetcher.js` — repurposed as `videoFetcher.js` (rename + modify)
- `omni-cart/public/background.js` — router update only
- `omni-cart/public/youtubeFetcher.js` — deleted
- `omni-cart/public/opencv.js` — deleted
- `omni-cart/public/videoFetcher.js` — new file (the renamed+modified shortsFetcher)

**No React UI files, serverless functions, or dashboard components are touched.**

---

## Sub-Tasks

---

### Sub-Task 1 — Create `videoFetcher.js` from `shortsFetcher.js`

**Intent:**
`shortsFetcher.js` already has the correct architecture: outer IIFE, inner async IIFE, `try/catch` error dispatch, canvas capture loop, `sendMessage` payload. We adopt it wholesale and make three targeted modifications:
1. **Dynamic aspect-ratio canvas** — replace the hardcoded `360×640` with logic that reads `activeVideo.videoWidth` / `activeVideo.videoHeight` and scales so the longest dimension is capped at 640px, preserving the ratio. This handles both landscape (YouTube Watch) and portrait (YouTube Shorts) correctly.
2. **Frame count** — increase from 3 to 4.
3. **Inter-frame delay** — increase from 400ms to 1500ms for a wider time-lapse across a maker tutorial.

**Expected Outcomes:**
- `omni-cart/public/videoFetcher.js` exists with the new logic.
- Canvas width/height are computed dynamically, not hardcoded.
- The capture loop runs exactly 4 times with 1500ms delays between captures (no delay after the last frame).
- Success dispatch: `chrome.runtime.sendMessage({ sourceType: 'video_frames', data: frames })`.
- Error dispatch: `chrome.runtime.sendMessage({ error: error.message })` via `catch`.
- The `shortsFetcher.js` `alert()` fallback on missing video is replaced with the `try/catch` error dispatch (consistent, no blocking `alert` dialogs).
- Log line updated to reflect the new file name: `"Omni-Cart: videoFetcher.js injected successfully."`.

**Dynamic scaling logic (pseudocode):**
```
const scale = 640 / Math.max(activeVideo.videoWidth, activeVideo.videoHeight);
canvas.width  = Math.round(activeVideo.videoWidth  * scale);
canvas.height = Math.round(activeVideo.videoHeight * scale);
```
This caps the longest edge at exactly 640px and shrinks the shorter edge proportionally.

**Todo List:**
1. Create `omni-cart/public/videoFetcher.js` as a new file (do NOT edit `shortsFetcher.js` in place — keep it until the router is updated so the repo is never in a broken state).
2. Base the content on the current `shortsFetcher.js` structure.
3. Replace the hardcoded `canvas.width = 360; canvas.height = 640;` block with the dynamic scale calculation above.
4. Change `const frameCount = 3` to `const frameCount = 4`.
5. Change the inter-frame `setTimeout` delay from `400` to `1500`.
6. Replace the `alert()` early-exit on missing video with `throw new Error("No active video found on page.")` so the outer `try/catch` handles it uniformly.
7. Update the log injection line to `"Omni-Cart: videoFetcher.js injected successfully."`.

**Relevant Context:**
- Source to mirror: `omni-cart/public/shortsFetcher.js` (lines 1–58)
- Canvas sizing: lines 22–24 in `shortsFetcher.js` — replace entirely
- Frame count: line 27 in `shortsFetcher.js`
- Delay: line 39 in `shortsFetcher.js`
- `sendMessage` payload key `sourceType: 'video_frames'` must be preserved (React UI listens for this)

**Status:** `[ ] pending`

---

### Sub-Task 2 — Update the router in `background.js`

**Intent:**
The router currently injects `["opencv.js", "youtubeFetcher.js"]` for `/watch` and `["opencv.js", "shortsFetcher.js"]` for `/shorts`. Both branches must be collapsed into a single `["videoFetcher.js"]` assignment that covers both URL patterns. The OpenCV preload is removed entirely.

**Expected Outcomes:**
- `if (url.includes("youtube.com/watch"))` and `else if (url.includes("youtube.com/shorts"))` are merged into a single condition using `||`.
- The `scriptFiles` array for both YouTube routes is `["videoFetcher.js"]` — no `opencv.js`, no old fetcher names.
- All other router logic (the `domFetcher.js` fallback, the `executeScript` call, error handling, log lines) is untouched.

**Todo List:**
1. Open `omni-cart/public/background.js`.
2. Replace lines 14–19 (the two separate `if`/`else if` YouTube branches) with a single combined condition:
   ```js
   if (url.includes("youtube.com/watch") || url.includes("youtube.com/shorts")) {
     scriptFiles = ["videoFetcher.js"];
   }
   ```
3. Remove the comment `// INJECT OPENCV FIRST, THEN THE FETCHER` (no longer accurate).

**Relevant Context:**
- File: `omni-cart/public/background.js`
- Lines to replace: 14–19 (the two YouTube routing branches)
- The `scriptFiles` default (`"domFetcher.js"`) at line 12 and all code below line 19 are untouched

**Status:** `[ ] pending`

---

### Sub-Task 3 — Delete dead files

**Intent:**
`youtubeFetcher.js` and `opencv.js` are now unreferenced. Leaving them in the repo creates confusion and inflates the extension's install footprint. `shortsFetcher.js` is superseded by `videoFetcher.js`. All three must be deleted.

**Expected Outcomes:**
- `omni-cart/public/youtubeFetcher.js` no longer exists.
- `omni-cart/public/opencv.js` no longer exists.
- `omni-cart/public/shortsFetcher.js` no longer exists.
- No other file in the repo references any of these three names.

**Todo List:**
1. Delete `omni-cart/public/youtubeFetcher.js`.
2. Delete `omni-cart/public/opencv.js`.
3. Delete `omni-cart/public/shortsFetcher.js`.
4. Grep the repo for any remaining references to `youtubeFetcher`, `shortsFetcher`, or `opencv.js` to confirm nothing is orphaned.

**Relevant Context:**
- After Sub-Task 2, `background.js` will have zero references to these files — safe to delete.
- `manifest.json` does not reference any content script files directly (scripts are injected programmatically via `chrome.scripting.executeScript`) — no manifest changes needed.

**Status:** `[x] done`

---

## Execution Order

```
Sub-Task 1 (create videoFetcher.js)
         │
         ▼
Sub-Task 2 (update background.js router)
         │
         ▼
Sub-Task 3 (delete youtubeFetcher.js, opencv.js, shortsFetcher.js)
```

Sub-Task 3 must come last — deleting the old files before the router is updated would leave the extension broken between steps.
