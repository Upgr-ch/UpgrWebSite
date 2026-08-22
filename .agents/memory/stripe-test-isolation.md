---
name: Stripe test-mode isolation
description: Keep Stripe test credentials and links separate from the live payment path.
---

Use dedicated test-only configuration (`STRIPE_TEST_MODE`, `STRIPE_TEST_SECRET_KEY`, and `STRIPE_TEST_WEBHOOK_SECRET`) for development tests. Do not replace the live Stripe secrets to test a checkout.

**Why:** Stripe test and live resources are separate. Replacing the live key or webhook signing secret to run a test can interrupt real purchase processing.

**How to apply:** Enable test mode only in development, configure the test Payment Link IDs there, and use a test-mode webhook secret for the development endpoint. Leave the production configuration on its live credentials and links.