---
name: Systeme.io tags
description: Renaming tags through the Systeme.io API while preserving their identifiers.
---

Systeme.io renames tags with a `PUT` request on the existing tag resource; the tag identifier remains stable, so automations that reference the tag continue to target it after the name changes. New tags use `POST`, while deleting an existing tag removes the resource that dependent automations target. The public API may not expose rules visible in the Systeme.io dashboard, so the dashboard is the source of truth for visual automation status.

**Why:** Automations are associated with the tag resource, not merely its displayed label.

**How to apply:** Update the existing tag instead of deleting and recreating it. Treat deletion as a breaking change for automations using that tag. When API and dashboard results differ, verify the active rule in the dashboard. Review external tools or API scripts separately if they refer to the old name as text.

Applying a buyer tag to a controlled contact successfully triggered the Systeme.io workflow and granted the associated training access, confirming the tag-based access path.

**Why:** A successful tag write alone does not prove that the downstream workflow grants access; a controlled contact test validates the full Systeme.io step.

**How to apply:** Test buyer tags with a controlled contact before relying on a paid checkout, and verify both the workflow email and the training access.

The `GET /tags?name=...` request can return the complete tag list rather than an exact-name-filtered result. Selecting the first returned item can therefore assign an unrelated tag (observed: `Pack Complet-Acheteur`).

**Why:** A 204 response for the tag write alone does not prove the intended tag was chosen or retained; it can silently launch the wrong automation.

**How to apply:** Select tags by exact `name` from the returned list, then re-fetch the contact and confirm the intended tag before declaring a workflow test successful. Before PATCHing custom contact fields, ensure their slugs exist in Systeme.io; missing slugs return HTTP 422.