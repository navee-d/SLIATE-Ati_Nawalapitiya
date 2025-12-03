# SLIATE Nawalapitiya Campus Management System - Design Guidelines

## Design Approach: Material Design + Professional SaaS Patterns

**Rationale**: Campus management systems prioritize data clarity, efficient workflows, and institutional credibility. Using Material Design principles with modern SaaS aesthetics (inspired by Linear and Notion) ensures:
- Clear information hierarchy for complex data tables and forms
- Professional appearance suitable for educational institutions
- Proven patterns for form-heavy interfaces
- Excellent accessibility and responsive behavior

---

## Typography System

**Primary Font**: Inter (Google Fonts)
**Secondary Font**: JetBrains Mono (for student IDs, codes, technical data)

### Hierarchy:
- **Page Titles**: `text-3xl font-bold tracking-tight` (Dashboard headers, main pages)
- **Section Headers**: `text-2xl font-semibold` (Card titles, panel headers)
- **Subsection Headers**: `text-lg font-semibold` (Table headers, form sections)
- **Body Text**: `text-base font-normal` (Forms, descriptions, table content)
- **Labels**: `text-sm font-medium` (Form labels, metadata)
- **Captions**: `text-xs text-gray-600` (Timestamps, helper text, fine print)
- **Student IDs/Codes**: `font-mono text-sm` (Technical identifiers)

---

## Layout System

### Spacing Primitives (Tailwind Units):
**Core Set**: 2, 4, 6, 8, 12, 16

**Application**:
- Component padding: `p-4` to `p-6`
- Section spacing: `gap-8`, `space-y-8`
- Card margins: `m-4`
- Large containers: `p-12` or `p-16`
- Tight elements: `gap-2`, `space-x-2`

### Grid System:
- **Dashboard Layouts**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **Form Layouts**: `grid grid-cols-1 md:grid-cols-2 gap-4`
- **Tables**: Full-width with responsive scroll
- **Max Container Width**: `max-w-7xl mx-auto px-4`

---

## Component Library

### Navigation & Structure

**Admin Sidebar** (Desktop):
- Fixed left sidebar, width `w-64`
- Logo at top with `p-6`
- Navigation groups with section headers (`text-xs uppercase tracking-wide font-semibold`)
- Nav items: `px-4 py-2 rounded-lg` with icon + label
- Active state: elevated with subtle shadow

**Mobile Navigation**:
- Top bar with hamburger menu
- Slide-out drawer navigation
- Bottom tab bar for student mobile view (4 primary actions)

**Top Header Bar**:
- Fixed across all pages, `h-16`
- Contains: breadcrumbs (left), user profile + notifications (right)
- Subtle bottom border

### Dashboard Components

**Stat Cards** (Admin Overview):
- Grid of 4 cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`
- Each card: rounded corners, subtle shadow, `p-6`
- Structure: Large number (text-3xl font-bold), label below, icon top-right
- Trend indicator (optional): small badge with arrow

**Quick Action Cards**:
- Larger cards with icon, title, description
- Call-to-action button at bottom
- Hover: subtle elevation increase

### Data Display

**Tables**:
- Clean zebra striping (subtle background alternation)
- Header row: slightly elevated, sticky on scroll, `text-sm font-semibold uppercase tracking-wide`
- Cell padding: `px-6 py-4`
- Row hover: subtle background change
- Action buttons: icon buttons aligned right
- Responsive: horizontal scroll on mobile with fixed first column

**Data Cards** (Mobile Alternative):
- Stack key-value pairs vertically
- Each field: label + value pair with consistent spacing

### Forms

**Form Structure**:
- Consistent label-above-input pattern
- Labels: `text-sm font-medium mb-1`
- Input fields: `px-4 py-2 rounded-lg border`
- Focus states: prominent border emphasis
- Helper text below inputs: `text-xs text-gray-600 mt-1`
- Error messages: `text-xs text-red-600 mt-1` with alert icon

**Form Sections**:
- Group related fields with section headers
- Section dividers: subtle horizontal lines with `my-8`

**Buttons**:
- Primary: Solid fill, medium size `px-6 py-2`
- Secondary: Outlined style
- Tertiary: Ghost/text only
- Icon buttons: Square, `p-2`
- Button groups: Tight spacing `gap-2`

### QR Attendance Interface

**QR Display (Lecturer View)**:
- Centered large QR code (300x300px minimum)
- Session details card above QR (time remaining, course info)
- Auto-refresh countdown indicator
- Clear "Close Session" button

**QR Scanner (Student Mobile View)**:
- Full-screen camera preview
- Centered viewfinder overlay (semi-transparent frame)
- Top bar: session info if QR detected
- Bottom: "Cancel" button
- Success: immediate selfie capture prompt

**Selfie Capture Modal**:
- Camera preview with circular guide overlay
- "Capture" button prominent at bottom
- Preview confirmation with "Retake" / "Submit" options

### Import/Export Interface

**Bulk Import Page**:
- Two-column layout: Instructions (left) + Upload zone (right)
- Prominent drag-and-drop zone with dashed border
- Template download link above upload zone
- Validation results table below (shows errors with row numbers)
- Download invalid rows as CSV button

**Export Interface**:
- Filter panel (date ranges, department selection)
- Export format selector (CSV/XLSX toggle)
- Preview data count
- Large "Export" button

### Library & Lab Management

**Book/PC Inventory Cards**:
- Grid layout with image thumbnail (books) or icon (PCs)
- Availability badge (Available/On Loan/Unavailable)
- Quick action button (Loan/Return/Assign)

**Loan Management**:
- Timeline view showing active loans
- Due date highlighting with visual urgency (green > yellow > red)
- Fine calculation display

### Exam Application

**Application Form**:
- Multi-step wizard with progress indicator
- Step indicator: numbered circles connected by lines
- Each step in separate card
- Navigation: Back/Next buttons at bottom

**Broadcast Interface** (Admin):
- Recipient selector (checkboxes for departments/programs)
- Message preview panel
- Send confirmation modal with recipient count

### Modals & Overlays

**Standard Modal**:
- Centered, `max-w-2xl`
- Header with title + close button
- Content area with `p-6`
- Footer with action buttons (right-aligned)
- Backdrop: semi-transparent overlay

**Confirmation Dialogs**:
- Smaller, `max-w-md`
- Icon at top (warning/success/error)
- Clear question text
- Two-button choice (Cancel/Confirm)

### Status Indicators

**Badges**:
- Pill-shaped, `px-3 py-1 rounded-full text-xs font-medium`
- Variants: Success, Warning, Error, Info, Neutral

**Role Badges**: 
- Color-coded: Admin (purple), Lecturer (blue), Student (green), Staff (gray)

---

## Animation Strategy

**Use Sparingly**:
- Page transitions: Simple fade-in (200ms)
- Modal entry: Gentle scale + fade (300ms)
- Dropdown menus: Slide down (200ms)
- Loading states: Subtle pulse on skeleton screens
- **No hover animations** on buttons (Button component handles internally)

**Avoid**:
- Scroll-triggered animations
- Complex transition effects
- Decorative motion

---

## Images

**Login/Landing Page**:
- Large hero image of campus buildings or students (if creating login page)
- Size: Full viewport height with overlay for form
- Placement: Background with gradient overlay for readability

**Dashboard**:
- No hero images
- Small institutional logo in sidebar
- Avatar images for user profiles (circular, 40x40px)

**Library Section**:
- Book cover images in inventory cards (80x120px thumbnails)
- Placeholder for books without covers

**Profile Sections**:
- User profile photos (circular avatars, multiple sizes: 32px, 48px, 96px)

---

## Accessibility

- All form inputs have associated labels
- Focus indicators on all interactive elements
- Color is never the only indicator of state
- Tables have proper header associations
- Modals trap focus and have escape key handlers
- Skip navigation link for keyboard users
- ARIA labels for icon-only buttons
- Sufficient contrast ratios (WCAG AA minimum)