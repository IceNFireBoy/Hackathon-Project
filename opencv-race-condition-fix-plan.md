# OpenCV Race Condition Fix Plan

## Top-Level Overview

**Goal:** Eliminate the "Computer Vision library missing or timed out" race-condition error that fires immediately when `youtubeFetcher.js` is injected into a YouTube page. The script runs its synchronous `typeof cv === 'undefined'` check before the OpenCV WebAssembly binary has finished compiling and initializing in the browser's memory.

**Scope:** Two files only — `omni-cart/public/youtubeFetcher.js` and `omni-cart/public/manifest.json`. No other files are touched.

**Confirmed Design Decisions:**
1. **Error wording** — The existing "no video" error path keeps specific wording. The synchronous `"Computer Vision library missing."` error is replaced with two distinct, debuggable messages:
   - Poller never even detected `window.cv`: `"Computer Vision library not detected — OpenCV script may have failed to inject."`
   - Poller detected `window.cv` but Wasm bindings never became ready: `"Computer Vision library loaded but Wasm runtime timed out after 8s — possible CSP or memory issue."`
   - (Both are sent via `chrome.runtime.sendMessage({ error: "..." })`)
2. **Readiness signal** — Use a dual-condition check for maximum robustness: `window.cv` is defined AND `typeof window.cv.Mat === 'function'`. The `opencv.js` in this repo is a standard Emscripten build that exposes `onRuntimeInitialized`, but since the script is injected by the extension (not loaded as a module), we cannot hook that callback reliably from the content script context. Polling `window.cv.Mat` is the correct and robust approach.
3. **File scope** — Only `omni-cart/public/youtubeFetcher.js` and `omni-cart/public/manifest.json` are modified.

---

## Sub-Tasks

---

### Sub-Task 1 — Add `'wasm-unsafe-eval'` to `manifest.json` CSP

**Intent:**
Manifest V3's default `extension_pages` CSP blocks runtime WebAssembly compilation. Adding `'wasm-unsafe-eval'` explicitly permits the Emscripten Wasm JIT step. Without this, OpenCV's Wasm binary may silently fail to compile even after it loads, so the `cv.Mat` constructor would never appear.

**Expected Outcomes:**
- The `extension_pages` value becomes: `"script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"`
- The `sandbox` CSP value and all other manifest fields remain untouched.

**Todo List:**
1. Open `omni-cart/public/manifest.json`.
2. Locate line 22: `"extension_pages": "script-src 'self'; object-src 'self';"`
3. Replace it with: `"extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"`

**Relevant Context:**
- File: `omni-cart/public/manifest.json` — line 22 is the only line to change.
- Current value: `"extension_pages": "script-src 'self'; object-src 'self';"`
- Target value:   `"extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"`

**Status:** `[ ] pending`

---

### Sub-Task 2 — Replace synchronous `cv` guard with async Wasm poller in `youtubeFetcher.js`

**Intent:**
The synchronous guard at lines 14–18 fires immediately at injection time, before the Wasm module has compiled. Replace it with a `waitForOpenCV()` function that returns a Promise, polling every 200ms until:
- Both `window.cv` is defined AND `window.cv.Mat` is a valid constructor (Wasm bindings live), OR
- 8 seconds have elapsed without those conditions being met (hard timeout, send specific error).

The entire `startVideoSampling()` call is moved inside the `.then()` of this promise, ensuring no OpenCV API call is ever made on an unready runtime.

**Expected Outcomes:**
- A `waitForOpenCV()` function is declared above `startVideoSampling()` inside the IIFE.
- The old synchronous guard block (lines 14–18) is fully removed from `startVideoSampling()`.
- On timeout, two distinct error messages are sent depending on whether `window.cv` was ever detected:
  - `window.cv` was never defined → `"Computer Vision library not detected — OpenCV script may have failed to inject."`
  - `window.cv` was defined but `cv.Mat` never appeared → `"Computer Vision library loaded but Wasm runtime timed out after 8s — possible CSP or memory issue."`
- `startVideoSampling()` is called only after the promise resolves.
- Everything inside `startVideoSampling()` (frame capture loop, OpenCV processing, memory cleanup, payload dispatch) is preserved exactly as-is.

**Todo List:**
1. Open `omni-cart/public/youtubeFetcher.js`.
2. Remove the synchronous guard block (current lines 14–18):
   ```js
   if (typeof cv === 'undefined') {
     console.error("Omni-Cart: OpenCV.js is not loaded.");
     chrome.runtime.sendMessage({ error: "Computer Vision library missing." });
     return;
   }
   ```
3. Insert the following `waitForOpenCV` function directly above the `startVideoSampling` function declaration:
   ```js
   function waitForOpenCV() {
     return new Promise((resolve, reject) => {
       const POLL_INTERVAL_MS = 200;
       const TIMEOUT_MS = 8000;
       let elapsed = 0;
       const intervalId = setInterval(() => {
         elapsed += POLL_INTERVAL_MS;
         if (window.cv && typeof window.cv.Mat === 'function') {
           clearInterval(intervalId);
           resolve();
         } else if (elapsed >= TIMEOUT_MS) {
           clearInterval(intervalId);
           const errorMsg = window.cv
             ? "Computer Vision library loaded but Wasm runtime timed out after 8s — possible CSP or memory issue."
             : "Computer Vision library not detected — OpenCV script may have failed to inject.";
           console.error("Omni-Cart:", errorMsg);
           chrome.runtime.sendMessage({ error: errorMsg });
           reject(new Error(errorMsg));
         }
       }, POLL_INTERVAL_MS);
     });
   }
   ```
4. Replace the bottom call `startVideoSampling();` (line 94) with:
   ```js
   waitForOpenCV().then(() => {
     startVideoSampling();
   });
   ```

**Relevant Context:**
- File: `omni-cart/public/youtubeFetcher.js`
- Synchronous guard to remove: lines 14–18.
- Insertion point for `waitForOpenCV`: above the `startVideoSampling` function declaration (before line 4).
- Call site to replace: line 94 — `startVideoSampling();`.
- The `startVideoSampling` function body is untouched.
- `opencv.js` is a standard Emscripten build — `window.cv.Mat` being a function is the canonical signal that the Wasm runtime has fully initialized.

**Status:** `[x] done`

---

## Execution Order

```
Sub-Task 1  →  Sub-Task 2
manifest.json CSP     youtubeFetcher.js poller
```

Sub-Task 1 first (low-risk, one-line change). Sub-Task 2 second (main logic change).
