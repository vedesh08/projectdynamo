# Deadline Dynamo - Specification Document

## 1. Project Overview

**Project Name:** Deadline Dynamo
**Type:** Single-page web application (HTML/CSS/JS)
**Core Functionality:** A fully browser-based task management app with localStorage persistence, featuring dice-themed branding
**Target Users:** Anyone needing personal task organization without server dependencies

---

## 2. UI/UX Specification

### Layout Structure

**Page Sections:**
- Fixed top navigation header (height: 60px)
- Collapsible sidebar (width: 250px, collapsible to 60px on mobile)
- Main content area (flexible)
- Modal overlays for task creation/editing

**Responsive Breakpoints:**
- Mobile: < 768px (sidebar hidden, hamburger menu)
- Tablet: 768px - 1024px (collapsed sidebar)
- Desktop: > 1024px (full sidebar)

### Visual Design

**Color Palette:**
- Primary: `#2D3748` (dark slate)
- Secondary: `#4A5568` (medium slate)
- Accent: `#F6AD55` (warm orange - dice themed)
- Success: `#68D391` (green)
- Warning: `#F6E05E` (yellow)
- Danger: `#FC8181` (red)
- Background: `#1A202C` (dark mode base)
- Surface: `#2D3748` (card backgrounds)
- Text Primary: `#F7FAFC`
- Text Secondary: `#A0AEC0`
- Border: `#4A5568`

**Dice Theme Colors:**
- Dice orange: `#F6AD55`
- Dice accent: `#ED8936`
- Dice highlight: `#FBD38D`

**Typography:**
- Font Family: 'Outfit', sans-serif (Google Fonts)
- Headings: 700 weight
- Body: 400 weight
- H1: 28px, H2: 24px, H3: 20px, Body: 16px, Small: 14px

**Spacing System:**
- Base unit: 8px
- Padding small: 8px
- Padding medium: 16px
- Padding large: 24px
- Gap: 16px
- Border radius: 12px (cards), 8px (buttons), 4px (inputs)

**Visual Effects:**
- Card shadows: `0 4px 6px rgba(0, 0, 0, 0.3)`
- Hover transitions: 0.2s ease
- Modal backdrop: rgba(0, 0, 0, 0.7)
- Focus rings: 2px solid accent color

### Components

**Navigation Header:**
- Logo: Dice icon (SVG) + "Deadline Dynamo" text
- Nav links: Home, 7-Day Report, Calendar, Categories
- Mobile hamburger menu button

**Sidebar:**
- Navigation items with icons
- Active state indicator (accent color left border)
- Collapse toggle button

**Task Card:**
- Title (bold), description preview
- Category badge, priority indicator (colored dot)
- Due date/time display
- Quick action buttons: complete, star, priority, more
- Hover: slight lift, border highlight
- States: default, hover, completed (strikethrough + opacity), canceled (grayed)

**Add Task Button:**
- Floating action button style or header button
- Dice icon with plus
- Orange accent color

**Modal Form:**
- Full-screen overlay with centered card
- Close button (X)
- Form fields with labels
- Save and Cancel buttons

**Category Card:**
- Folder-style icon
- Category name
- Task count badge
- Color indicator strip

**Calendar Grid:**
- 7-column grid for days
- Date numbers
- Task count badges (colored by priority)
- Hover preview popover
- Today highlight (accent border)

**7-Day Report Cards:**
- Date header
- Section: completed tasks (green), incomplete (orange)
- Task list with quick complete buttons
- Progress bar (optional)

---

## 3. Functionality Specification

### Data Schema

```javascript
Task {
  id: string (uuid)
  title: string (required)
  description: string (optional)
  category: string (optional)
  dueDate: string (YYYY-MM-DD, optional)
  dueTime: string (HH:MM, optional)
  priority: 'low' | 'medium' | 'high' (default: 'medium')
  completed: boolean (default: false)
  canceled: boolean (default: false)
  starred: boolean (default: false)
  createdAt: timestamp
  completedAt: timestamp (optional)
}

Category {
  id: string (uuid)
  name: string
  color: string (hex)
  createdAt: timestamp
}
```

### Core Features

**1. Task CRUD Operations:**
- Create: Open modal, fill form, save to localStorage
- Read: Load all tasks from localStorage on page load
- Update: Click edit icon, modify in modal, save
- Delete: Confirm dialog, remove from storage

**2. Task Actions:**
- Toggle complete (checkbox, adds completedAt timestamp)
- Toggle star (persists)
- Toggle priority (cycles: low → medium → high → low)
- Shift to tomorrow (adds 1 day to dueDate)
- Cancel task (sets canceled: true, grays out)
- Duplicate task (creates copy with new ID)

**3. Filtering & Sorting:**
- Filter: All, Active, Completed, Canceled, Starred
- Sort: By due date, by priority, by category, by created date

**4. Search:**
- Real-time search by title and description

**5. Categories:**
- Create custom categories
- Edit category name and color
- Delete category (tasks become uncategorized)
- Filter tasks by category

**6. 7-Day Report:**
- Past 3 days: completed tasks
- Today: due today (completed + incomplete)
- Next 3 days: upcoming

**7. Calendar View:**
- Display current month
- Show task counts per day
- Click day to see task list
- Add task from specific date
- Navigate months (optional)

### User Interactions

- Click "Add Task" → Modal opens with slide-up animation
- Click task card → Expand details or edit
- Click checkbox → Toggle complete with check animation
- Click star → Toggle with bounce animation
- Swipe/click sidebar → Navigate views
- Click calendar date → Show tasks for that day

### Edge Cases

- Empty state: Show friendly message with call to action
- Long task titles: Truncate with ellipsis
- No due date: Show "No deadline" placeholder
- Past due dates: Visual warning (red text)
- localStorage full: Show error, suggest cleanup

---

## 4. Acceptance Criteria

### Visual Checkpoints
- [ ] Dice logo visible in header
- [ ] Dark theme applied consistently
- [ ] Orange accent color on interactive elements
- [ ] Smooth animations on task add/remove/complete
- [ ] Responsive layout works on mobile
- [ ] All icons render correctly

### Functional Checkpoints
- [ ] Add task saves to localStorage
- [ ] Tasks persist after page refresh
- [ ] Filter buttons work correctly
- [ ] Sort options reorder tasks
- [ ] Search filters tasks in real-time
- [ ] Category creation works
- [ ] Calendar shows task counts
- [ ] 7-Day report displays correctly
- [ ] Task actions (complete, star, cancel, shift) work
- [ ] Delete removes task permanently

### Animation Checkpoints
- [ ] Task cards fade/slide in on create
- [ ] Checkbox has smooth toggle animation
- [ ] Modal opens with smooth transition
- [ ] Hover effects on cards and buttons
- [ ] Page transitions are smooth

---

## 5. Technical Notes

- Single HTML file with embedded CSS and JavaScript
- Google Fonts: Outfit
- No external dependencies beyond fonts
- localStorage keys: 'deadline_dynamo_tasks', 'deadline_dynamo_categories'
- SVG icons embedded inline
- CSS custom properties for theming
- ES6+ JavaScript features