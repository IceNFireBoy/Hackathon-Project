# Logo Integration Plan

## Overview

Two logo assets have been added to `public/`:
- `OMNI_CART_LOGO.png` — solid background, for the Chrome Extension manifest (toolbar icon, extension tile).
- `OMNI_CART_LOGO_TRANS.png` — transparent background, for use inside React UI components.

Currently, no component references either image — all branding is text-only. The manifest has no `"icons"` key and no `default_icon` in the `"action"` object.

This plan adds the logos to exactly three places: the manifest, the extension popup header, and the web dashboard sidebar/mobile header. No logic, context, or layout CSS is changed.

---

## Sub-Task 1: Update `public/manifest.json`

**Intent**  
Register the solid-background logo as the Chrome Extension icon so it appears in the toolbar, extensions page, and Chrome Web Store.

**Expected Outcomes**  
- `manifest.json` gains a top-level `"icons"` object with keys `"16"`, `"48"`, `"128"` all pointing to `OMNI_CART_LOGO.png`.  
- The `"action"` object gains a `"default_icon"` sub-object with the same three keys and values.

**Todo List**  
1. Open `omni-cart/public/manifest.json`.  
2. Add a `"icons"` object at the top level (after `"description"`).  
3. Add a `"default_icon"` object inside the existing `"action"` object.

**Relevant Context**  
- File: `omni-cart/public/manifest.json`  
- Current `"action"` block only has `"default_popup": "index.html"` (line 6–8).  
- No `"icons"` key exists yet.

**Status** — `[ ] pending`

---

## Sub-Task 2: Add Logo to Extension Popup Header (`ExtensionHeader`)

**Intent**  
Replace the text-only `<h1>OMNI-CART</h1>` in the Chrome Extension popup header with an inline logo image + text layout, using the transparent logo.

**Expected Outcomes**
- The `ExtensionHeader` component renders an `<img src="/OMNI_CART_LOGO_TRANS.png" … className="w-6 h-6 object-contain" />` alongside the existing title text.
- The header title is restructured to a compact flex row: `[logo img] [OMNI][-CART]` — no subtitle, no large padding (popup is space-constrained).
- No other component or prop is changed.

**Todo List**
1. Open `omni-cart/src/components/extension.jsx`.
2. In `ExtensionHeader`, replace the `<h1>` text block with the compact flex wrapper containing the `<img>` (w-6 h-6) and title `<h1>`.

**Relevant Context**
- File: `omni-cart/src/components/extension.jsx`, lines 13–16 (`ExtensionHeader` return block).
- Current markup: `<h1 className="text-xl font-black tracking-widest text-accent …">OMNI-CART</h1>`.
- Corrected target markup (compact — for small popup viewport):
  ```jsx
  <div className="flex items-center space-x-2">
    <img src="/OMNI_CART_LOGO_Trans.png" alt="Logo" className="w-6 h-6 object-contain" />
    <h1 className="text-lg font-bold tracking-wide text-accent">
      OMNI<span className="text-gray-100">-CART</span>
    </h1>
  </div>
  ```

**Status** — `[ ] pending`

---

## Sub-Task 3: Add Logo to Dashboard Sidebar + Mobile Header

**Intent**  
Replace the text-only branding blocks in the web dashboard sidebar (`SidebarNav`) and the mobile sticky header (`DashboardShell`) with the transparent logo image + text layout.

**Expected Outcomes**
- In `SidebarNav` (dashboard.jsx lines 55–60): the `<div className="p-4 …">` branding block is replaced with the larger flex row containing the logo `<img>` (w-8 h-8), title `<h1>`, and "Maker Procurement" subtitle `<p>`.
- In `DashboardShell` (layouts/DashboardShell.jsx line 72): the `<span>OMNI-CART</span>` is replaced with the compact flex row containing the logo `<img>` (w-6 h-6) and the `<h1>` title (no subtitle).

**Todo List**
1. Open `omni-cart/src/components/dashboard.jsx`.
2. In `SidebarNav`, replace the inner branding `<div>` (lines 55–60) with the large logo + stacked title/subtitle block.
3. Open `omni-cart/src/layouts/DashboardShell.jsx`.
4. In the mobile `<header>` (line 72), replace the text `<span>` with the compact logo + title flex block.

**Relevant Context**
- File: `omni-cart/src/components/dashboard.jsx`, lines 55–60.
- File: `omni-cart/src/layouts/DashboardShell.jsx`, line 72.
- Sidebar target markup (large — full sidebar has room for subtitle and padding):
  ```jsx
  <div className="flex items-center space-x-3 px-4 py-6">
    <img src="/OMNI_CART_LOGO_Trans.png" alt="Omni-Cart Logo" className="w-8 h-8 object-contain" />
    <div>
      <h1 className="text-xl font-bold tracking-wider text-accent">
        OMNI<span className="text-gray-100">-CART</span>
      </h1>
      <p className="text-xs text-gray-500 uppercase tracking-widest">Maker Procurement</p>
    </div>
  </div>
  ```
- Mobile header target markup (compact — constrained mobile bar):
  ```jsx
  <div className="flex items-center space-x-2">
    <img src="/OMNI_CART_LOGO_Trans.png" alt="Logo" className="w-6 h-6 object-contain" />
    <h1 className="text-lg font-bold tracking-wide text-accent">
      OMNI<span className="text-gray-100">-CART</span>
    </h1>
  </div>
  ```

**Status** — `[ ] pending`
