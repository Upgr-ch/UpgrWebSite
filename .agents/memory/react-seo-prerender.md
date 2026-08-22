---
name: React SEO prerender
description: Keeping static SEO markup and final titles intact when a bundled React app hydrates.
---

Keep SEO prerender markup outside the React mount node, and ensure the final document title is applied after React has mounted when the compiled app sets its own title.

**Why:** React replaces the contents of its mount node on startup. A prerender block placed inside it disappears from the DOM, and the bundled application's title effect can overwrite the static HTML title.

**How to apply:** On static landing pages served alongside a bundled React app, place the SEO block next to—not inside—the root mount element, hide it without using `display: none`, and verify the final browser DOM and title after JavaScript runs.