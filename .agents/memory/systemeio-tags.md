---
name: Systeme.io tags
description: Renaming tags through the Systeme.io API while preserving their identifiers.
---

Systeme.io renames tags with a `PUT` request on the existing tag resource; the tag identifier remains stable, so automations that reference the tag continue to target it after the name changes. New tags use `POST`, while deleting an existing tag removes the resource that dependent automations target. The public API may not expose rules visible in the Systeme.io dashboard, so the dashboard is the source of truth for visual automation status.

**Why:** Automations are associated with the tag resource, not merely its displayed label.

**How to apply:** Update the existing tag instead of deleting and recreating it. Treat deletion as a breaking change for automations using that tag. When API and dashboard results differ, verify the active rule in the dashboard. Review external tools or API scripts separately if they refer to the old name as text.