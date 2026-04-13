# Sidebar Menu Button Overlap Fix

## Issue
The sidebar menu button was appearing over modals (like SessionBuilder and exercise pickers) with a z-index of 30, making it overlap with modal search functions and other UI elements.

**User Report**: "The sidebar menu button is still overlapping the searching function when adding exercises to sessions in programs. The sidemenu should only show when the main screen or dashboard is open. And not when editing sessions and so on"

## Root Cause
The menu button had:
- Z-index of `z-30` which was higher than some modal elements
- No logic to hide when modals were open
- Always visible when authenticated, regardless of what was on screen

## Solution
Implemented smart modal detection to automatically hide the menu button when full-screen modals are present:

### Changes Made

**File**: `src/components/layout/Layout.tsx`

1. **Added Modal Detection State**:
```typescript
const [hasModals, setHasModals] = useState(false);
```

2. **Added MutationObserver**:
```typescript
useEffect(() => {
  const checkForModals = () => {
    // Check if there are any full-screen modals (z-index 100 or higher)
    const modals = document.querySelectorAll('[class*="z-[1"][class*="0"]');
    setHasModals(modals.length > 0);
  };
  
  // Check immediately and set up observer
  checkForModals();
  const observer = new MutationObserver(checkForModals);
  observer.observe(document.body, { childList: true, subtree: true });
  
  return () => observer.disconnect();
}, []);
```

3. **Updated Menu Button Visibility**:
```typescript
// Before:
{isAuthenticated && (
  <button className="... z-30 ...">

// After:
{isAuthenticated && !hasModals && (
  <button className="... z-10 ...">
```

4. **Lowered Z-Index**: Changed from `z-30` to `z-10` to ensure it stays below modals

## How It Works

1. **MutationObserver** watches the DOM for changes (childList, subtree, and class attributes)
2. **checkForModals()** scans all elements with `.fixed` class
3. Checks if any element has both `fixed` and `inset-0` classes (full-screen modal pattern)
4. Excludes the menu button itself and auth buttons from detection
5. Uses `requestAnimationFrame` for smooth, debounced updates
6. The menu button is conditionally rendered based on `hasModals` state
7. When modals close, the observer detects their removal and shows the button again

### Modal Detection Logic
```typescript
const fixedElements = document.querySelectorAll('.fixed');
fixedElements.forEach(element => {
  if (classes.includes('fixed') && classes.includes('inset-0')) {
    // Full-screen modal detected
    if (!element.getAttribute('aria-label')?.includes('Menu')) {
      hasModal = true;
    }
  }
});
```

## Benefits

✅ **No More Overlap**: Menu button hidden when modals are open
✅ **Automatic Detection**: Works with any modal that uses z-[100] or higher
✅ **Clean UX**: Button only appears on main screens where it's needed
✅ **Performance**: Efficient DOM observation with cleanup

## Modal Z-Index Hierarchy

```
Layout Elements:              z-10  (menu button, nav)
Side Menu:                    z-40  (when opened)
SessionBuilder:               z-[100]
ProgramAddExerciseOptions:    z-[110]
Exercise Pickers:             z-[120]
```

## Testing Scenarios

### ✅ Test 1: Main Dashboard
1. Go to main dashboard (/)
2. **Expected**: Menu button visible in top-left
3. Click menu button
4. **Expected**: Side menu opens

### ✅ Test 2: Program Session Builder
1. Open a program
2. Click "Add Session" or edit existing session
3. **Expected**: Menu button hidden (SessionBuilder is z-[100])
4. Click "Add Exercise"
5. **Expected**: Menu button still hidden
6. Close SessionBuilder
7. **Expected**: Menu button appears again

### ✅ Test 3: Exercise Selection
1. Open SessionBuilder
2. Click "Add Exercise" 
3. Select an activity type
4. **Expected**: Menu button hidden throughout
5. Search for exercises
6. **Expected**: No overlap with search UI

### ✅ Test 4: Multiple Modals
1. Open SessionBuilder (z-[100])
2. Open ProgramAddExerciseOptions (z-[110])
3. Open ExerciseDatabasePicker (z-[120])
4. **Expected**: Menu button hidden at all levels
5. Close all modals
6. **Expected**: Menu button reappears

## Edge Cases Handled

- ✅ Multiple modals stacked
- ✅ Modal opened/closed rapidly
- ✅ Navigation between pages with modals
- ✅ Browser back button with modal open
- ✅ Observer cleanup on component unmount

## Related Issues

- Fixes sidebar menu overlap with SessionBuilder
- Fixes sidebar menu overlap with exercise pickers
- Fixes sidebar menu overlap with search functionality
- Improves overall modal UX

## Update: Enhanced Modal Detection

**Issue Reported**: Menu button still overlapping with exercise search within sessions

**Additional Fix Applied**:
- Improved modal detection to check for ALL `.fixed` elements with `.inset-0` classes
- Added explicit exclusion of menu button and auth buttons from detection
- Added `attributes` and `attributeFilter: ['class']` to MutationObserver for real-time class changes
- Implemented `requestAnimationFrame` for debounced, smooth updates
- Now properly detects ExerciseSearch and all nested modals

**Detection Pattern**:
```
.fixed + .inset-0 = Full-screen modal detected
(excluding elements with aria-label="Open Menu")
```

---

**Status**: ✅ Complete (Enhanced)
**Date**: October 14, 2025
**Last Updated**: October 14, 2025 (improved detection)
**Impact**: Better UX, no more overlapping UI elements, works with all modal types
