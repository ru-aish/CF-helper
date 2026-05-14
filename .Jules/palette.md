## 2024-05-13 - Missing ARIA Labels on Icon Buttons
**Learning:** Found that several primary navigation and action buttons (like sidebar toggle, settings, logout, and send message) rely solely on icons without ARIA labels, making them inaccessible to screen reader users.
**Action:** Always verify that icon-only buttons have an `aria-label` attribute describing their action.
