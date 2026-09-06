---
name: Canonical domain
description: Official public origin and the external hosting condition required for SEO URL consolidation.
---

Use `https://www.upgr.ch` as the sole canonical origin for public SEO URLs.

**Why:** The user explicitly selected the HTTPS `www` origin because existing canonicals, robots.txt, and sitemap already use it. On 2026-09-06, the apex and `www` hosts were observed serving different deployments, so code-level redirects alone cannot fully consolidate production until both hosts reach the current app.

**How to apply:** Keep canonicals, sitemap entries, and public redirects on HTTPS `www`. Before publishing or validating SEO changes, verify that both apex and `www` resolve to the intended current deployment and that HTTP/non-www variants redirect to HTTPS `www`.