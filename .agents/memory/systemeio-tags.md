---
name: Systeme.io tags
description: Renaming tags through the Systeme.io API while preserving their identifiers.
---

Systeme.io renames tags with a `PUT` request on the existing tag resource; the tag identifier remains stable, so automations that reference the tag continue to target it after the name changes.

**Why:** Automations are associated with the tag resource, not merely its displayed label.

**How to apply:** Update the existing tag instead of deleting and recreating it. Review external tools or API scripts separately if they refer to the old name as text.