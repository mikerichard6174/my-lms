# Roles and Permissions

The LMS prototype models four personas: student, parent, teacher, and administrator. Each role receives tailored navigation, capabilities, and default permissions. This document outlines the responsibilities and surface area for each persona and shows how permissions map onto UI elements.

| Role | Default landing page | Core permissions | Typical tasks |
|------|----------------------|------------------|---------------|
| **Student** | `frontend/student/dashboard.html` | `view:student-dashboard`, `view:lessons`, `track:progress` | View assigned lessons, launch activities, monitor daily focus items, and review recent achievements. |
| **Parent/Guardian** | `frontend/parent/dashboard.html` | `view:parent-dashboard`, `manage:schedule`, `manage:goals`, `review:grades` | Configure weekly lesson schedules, set completion targets, review attempt history, and override recorded grades when needed. |
| **Teacher** | `frontend/teacher/dashboard.html` | `view:teacher-dashboard`, `assign:lessons`, `track:class-progress`, `comment:feedback` | Plan assignments, monitor class progress (future feature), and provide qualitative feedback. The current prototype includes structural placeholders for these workflows. |
| **Administrator** | `frontend/admin/dashboard.html` | `view:admin-dashboard`, `manage:users`, `configure:curriculum`, `audit:reports` | Manage district-level accounts, control curriculum mappings, and audit compliance data. The present UI offers scaffolding for these controls, with data integrations slated for later iterations. |

## Linking parent and student accounts

The seeded data models a single household: parent `parent1` is linked to student `student1` via the `parent_id` column in SQLite. When persistence expands beyond the prototype, the relationship will support:

* Viewing aggregated progress for all children on the parent dashboard.
* Approving grade adjustments or goal updates with audit trails.
* Sharing schedules between parent and student portals.

## Permission-driven UI visibility

The `scripts/session.js` module hides DOM nodes marked with `data-requires-role="roleA,roleB"` if the authenticated user lacks the necessary role. This enables authoring shared templates while still keeping sensitive controls (e.g., grade overrides) exclusive to parents and administrators.

## Extending roles

1. Insert the new role into the `roles` table in `backend/server.js` with a unique `name` and JSON-encoded `permissions` array.
2. Update `redirectMap` in `scripts/auth.js` and `roleRedirect` in `scripts/session.js` so the login hub knows where to send authenticated users.
3. Add a new dashboard shell under `frontend/<role>/` and mark it with `data-required-role="role-name"` to ensure access checks fire automatically.
4. Document the additional role in this file so implementers understand their capabilities.

As the LMS matures, consider replacing the string-based permission checks with a central policy engine so granular capabilities (e.g., “edit attendance”, “publish announcements”) can be controlled without redeploying the front end.
