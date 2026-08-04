# Exit 8 - TODO List

## Overview
This document tracks remaining tasks and incomplete items for the Exit 8 game implementation.

---

## 🚨 Critical Issues

### 1. Inline Styles in JavaScript
**File:** `js/anomaly-registry.js`  
**Status:** ❌ Not Completed  
**Description:** The anomaly registry contains extensive inline styles within the `renderConfig` objects. These should be moved to CSS classes for better maintainability and separation of concerns.

**Affected Anomalies:**
- `POSTER` - lines 24-33 (position, colors, borders)
- `LIGHT` - lines 44-54 (position, animation, box-shadow)
- `FLOOR` - lines 65-74 (position, clip-path)
- `SIGN` - lines 85-102 (position, transform, typography)
- `SHADOW` - lines 113-123 (position, filter, transform)
- `DOOR` - lines 134-144 (position, borders)
- `HAND` - lines 155-166 (position, border-radius, transform)
- `FIGURE` - lines 177-218 (position, children elements with inline styles)

**Required Action:**
- Create CSS classes in `css/anomaly-renders.css` or new `css/anomalies.css`
- Replace `style` objects with `class` references
- Update `js/renderer.js` to apply classes instead of inline styles

---

### 2. Fixed Container Size
**File:** `css/style.css`  
**Status:** ❌ Not Completed  
**Description:** The corridor container uses fixed dimensions (800px × 500px) which doesn't fully leverage responsive design principles.

**Current Code (lines 300-306):**
```css
.corridor {
    position: relative;
    width: 800px;
    height: 500px;
    perspective: 1000px;
    transform-style: preserve-3d;
}
```

**Required Action:**
- Use relative units (%, vh, vw, rem) instead of fixed pixels
- Ensure proper scaling across all screen sizes
- Test on mobile, tablet, and desktop viewports
- Maintain aspect ratio while allowing flexible sizing

---

### 3. Duplicate CSS Classes
**File:** `css/style.css`  
**Status:** ❌ Not Completed  
**Description:** The `.hidden` utility class is defined twice (lines 502-504 and 510-512).

**Current Code:**
```css
/* Line 502-504 */
.hidden {
    display: none !important;
}

/* Line 510-512 */
.hidden {
    display: none !important;
}
```

**Required Action:**
- Remove duplicate definition (lines 510-512)
- Verify no other duplicate utility classes exist

---

## ✅ Completed Items (Reference)

### Phase 1: Core Functionality
- [x] Basic game loop implementation
- [x] Round progression system
- [x] Anomaly detection logic
- [x] Win/lose conditions

### Phase 2: UI/UX Improvements
- [x] Neutral status messages (no spoiler hints)
- [x] Clear button states and feedback
- [x] Consistent visual design

### Phase 3: Accessibility
- [x] Keyboard navigation support
- [x] `preventDefault()` on key handlers
- [x] `aria-live` regions for status updates
- [x] `aria-label` on interactive elements
- [x] `:focus-visible` styles
- [x] `prefers-reduced-motion` support
- [x] Removed duplicate CSS keyframes

### Phase 4: Documentation
- [x] Updated README.md with accurate implementation status
- [x] Added manual test checklist
- [x] Documented known limitations
- [x] Marked plan.md as historical document
- [x] Created root-level readme.md

---

## 📋 Testing Checklist for Remaining Items

### Inline Styles Removal
- [ ] All anomaly visual definitions use CSS classes
- [ ] No `style` property in `ANOMALY_REGISTRY`
- [ ] Renderer applies classes correctly
- [ ] Visual appearance unchanged after refactoring

### Responsive Container
- [ ] Corridor scales properly on 1920×1080
- [ ] Corridor scales properly on 1366×768
- [ ] Corridor scales properly on 768×1024 (tablet)
- [ ] Corridor scales properly on 375×667 (mobile)
- [ ] Aspect ratio maintained across all sizes
- [ ] No overflow or clipping issues

### CSS Cleanup
- [ ] No duplicate class definitions
- [ ] CSS linting passes without warnings
- [ ] File size reduced after cleanup

---

## 🔧 Priority Order

1. **High Priority:** Remove inline styles (affects maintainability and theming)
2. **Medium Priority:** Fix fixed container size (affects user experience on various devices)
3. **Low Priority:** Remove duplicate CSS classes (code cleanliness)

---

## 📝 Notes

- The game is **functional** and playable in its current state
- Remaining items are **improvements** for code quality and best practices
- All core gameplay features are complete and working
- Accessibility features from Phase 3 are fully implemented

---

*Last Updated: 2026-08-04*
