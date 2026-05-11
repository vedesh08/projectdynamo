# Deadline Dynamo - Project Context

## Project Overview

**Type:** Single-page web application (HTML/CSS/JS)
**Purpose:** Browser-based task management app with localStorage persistence
**Target Users:** Anyone needing personal task organization without server dependencies

---

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (ES6+)
- **Storage:** localStorage (keys: `deadline_dynamo_tasks`, `deadline_dynamo_categories`)
- **Fonts:** Outfit (Google Fonts)
- **No external dependencies** beyond fonts

---

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main HTML structure with all views (home, report, calendar, categories) |
| `style.css` | All styling with CSS custom properties, responsive breakpoints |
| `app.js` | All JavaScript logic, state management, localStorage handling |
| `SPEC.md` | Full specification document |
| `static/deadline-dynamo-logo.png` | App logo |

---

## Data Schema

```javascript
Task {
  id: string (generated)
  title: string (required)
  description: string
  category: string (category id)
  dueDate: string (YYYY-MM-DD)
  dueTime: string (HH:MM)
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  canceled: boolean
  starred: boolean
  createdAt: timestamp
  completedAt: timestamp
}

Category {
  id: string
  name: string
  color: string (hex)
  createdAt: timestamp
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 768px | Sidebar hidden, hamburger menu |
| Tablet | 768px - 1023px | Sidebar visible, main content adjusted |
| Desktop | >= 1024px | Full sidebar visible |

---

## Features

- **Task CRUD** - Create, read, update, delete tasks
- **Task Actions** - Complete, star, priority toggle, cancel, shift to tomorrow, duplicate
- **Filtering** - All, Active, Completed, Canceled, Starred
- **Sorting** - By created date, due date, priority, category
- **Search** - Real-time search by title/description
- **Categories** - Create, edit, delete with color picker
- **7-Day Report** - Past 3 days, today, next 3 days
- **Calendar** - Monthly view with task counts, click to see tasks
- **Progress Tracking** - Sidebar stats and per-view progress bars

---

## Recent Changes

- Fixed sidebar layout for mobile/tablet/desktop
- Made progress bar and delete button stick to bottom of sidebar
- Added tablet breakpoint (768px-1023px) handling
- Added smooth scrolling for mobile/tablet

---

## Color Palette

| Purpose | Color |
|---------|-------|
| Primary | #2D3748 |
| Secondary | #4A5568 |
| Accent (Dice Orange) | #F6AD55 |
| Background | #1A202C |
| Surface | #2D3748 |
| Success | #68D391 |
| Warning | #F6E05E |
| Danger | #FC8181 |

---

## CSS Structure

- CSS custom properties defined in `:root`
- Mobile-first approach with `@media` queries
- Key sections: Header, Sidebar, Main, Modal, Task components
- Animations: slideIn, pulse for overdue tasks

---

## Common Development Patterns

- `renderAll()` - Main render function called after any data change
- `saveTasks()` / `saveCategories()` - localStorage persistence
- Event delegation for dynamic elements
- Modal-based form inputs
- View switching via `data-view` attributes