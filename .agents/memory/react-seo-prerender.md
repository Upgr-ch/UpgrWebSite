---
name: React SEO prerender
description: Keeping static SEO markup visitor-visible and final titles intact when a bundled React app hydrates.
---

Keep initial SEO prerender markup visible to visitors inside the React mount node, so React naturally replaces it after hydration. Ensure the final document title is applied after React has mounted when the compiled app sets its own title.

**Why:** Hiding text from visitors while presenting it to crawlers can be interpreted as cloaking. React replaces the contents of its mount node on startup, which provides a natural handoff from visible static content to the interactive application.

**How to apply:** On static landing pages served alongside a bundled React app, place the prerender block inside the root mount element in normal document flow. Do not use off-screen positioning, tiny dimensions, clipping, `aria-hidden`, or any other concealment for that content. Verify both the raw response and the hydrated browser view.