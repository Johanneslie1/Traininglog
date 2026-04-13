# TrainingLog Color System - Quick Reference

**Last Updated:** February 13, 2026  
**See full analysis:** `COLOR_SYSTEM_ANALYSIS.md`

---

## 🎨 Current Color Tokens

### Base Colors
```css
/* Dark Theme (default) */
--color-bg-primary: #0A0A0A
--color-bg-secondary: #1A1A1A
--color-bg-tertiary: #2A2A2A
--color-bg-quaternary: #3A3A3A

/* Text */
--color-text-primary: #FFFFFF
--color-text-secondary: #B0B0B0
--color-text-tertiary: #808080
--color-text-muted: #666666 ⚠️ (Fails WCAG - fix to #999999)
```

### Brand/Accent
```css
--color-accent-primary: #8B5CF6 (Purple 500)
--color-accent-secondary: #7C3AED (Purple 600)
```

### Status Colors
```css
--color-success: #10B981 (Green)
--color-warning: #F59E0B (Amber)
--color-error: #EF4444 (Red)
--color-info: #3B82F6 (Blue)
```

### Activity Types (Hardcoded - needs migration)
| Type | Current Color | Issue |
|------|---------------|-------|
| Resistance | `bg-blue-600` | ✅ OK |
| Sport | `bg-green-600` | ✅ OK |
| Stretching | `bg-purple-600` | ⚠️ Conflicts with brand |
| Endurance | `bg-orange-600` | ✅ OK |
| Speed/Agility | `bg-red-600` | ⚠️ Conflicts with error |
| Other | `bg-gray-600` | ✅ OK |

---

## ⚠️ Critical Issues

### 1. WCAG Failures
- **Muted text** (`#666666`): 3.9:1 ratio ❌ → Fix to `#999999`
- **Light theme success** (`#10B981`): 3.8:1 ratio ❌ → Fix to `#059669`

### 2. Activity Color Conflicts
- **Stretching purple** conflicts with **brand purple**
- **Speed red** conflicts with **error red**

### 3. Hardcoded Colors
- 50+ instances of `bg-blue-600`, `bg-green-600` in components
- Should use semantic tokens: `bg-activity-resistance`

---

## ✅ Immediate Actions (Phase 1)

### Fix 1: Update Muted Text
```css
/* theme.css */
:root {
  --color-text-muted: #999999; /* Was #666666 */
}

.light {
  --color-text-muted: #6B6B6B; /* Was #A3A3A3 */
}
```

### Fix 2: Add Activity Type Tokens
```css
/* theme.css - Add these */
:root {
  --color-activity-resistance: #2563EB;
  --color-activity-sport: #16A34A;
  --color-activity-stretching: #06B6D4; /* CYAN not purple */
  --color-activity-endurance: #EA580C;
  --color-activity-speed: #DC2626;
  --color-activity-other: #4B5563;
}
```

```javascript
// tailwind.config.js - Add these
colors: {
  'activity-resistance': 'var(--color-activity-resistance)',
  'activity-sport': 'var(--color-activity-sport)',
  'activity-stretching': 'var(--color-activity-stretching)',
  'activity-endurance': 'var(--color-activity-endurance)',
  'activity-speed': 'var(--color-activity-speed)',
  'activity-other': 'var(--color-activity-other)',
}
```

### Fix 3: Update ProgramBuilder.tsx
```tsx
// Before
case ActivityType.STRETCHING:
  return { label: 'Stretching', color: 'bg-purple-600', textColor: 'text-purple-100' };

// After
case ActivityType.STRETCHING:
  return { label: 'Stretching', color: 'bg-activity-stretching', textColor: 'text-white' };
```

### Fix 4: Add Focus Ring
```css
/* theme.css */
:root {
  --color-focus-ring: #A78BFA;
}

/* Apply to interactive elements */
.button:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

---

## 🎯 Usage Guidelines

### DO ✅
```tsx
/* Use semantic tokens */
<button className="bg-accent-primary hover:bg-accent-secondary">
<span className="text-success">Complete</span>
<div className="bg-activity-resistance">Resistance</div>
```

### DON'T ❌
```tsx
/* Don't use hardcoded Tailwind colors */
<button className="bg-blue-600 hover:bg-blue-700">
<span className="text-green-500">Complete</span>
<div className="bg-purple-600">Stretching</div>
```

---

## 📊 Chart Colors (chartDataFormatters.ts)

**Current palette:**
```javascript
['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
```

**Issue:** Not colorblind-safe (red/green adjacent)

**Add colorblind mode:**
```javascript
export const COLORBLIND_SAFE_PALETTE = [
  '#0173B2', '#DE8F05', '#029E73', '#CC78BC', 
  '#CA9161', '#FBAFE4', '#949494', '#ECE133'
];
```

---

## 🚀 Quick Wins

1. **Search/replace in VSCode:**
   - `bg-blue-600` → `bg-activity-resistance` (in ProgramBuilder context)
   - `bg-purple-600` → `bg-activity-stretching` (for stretching activities)
   - `text-gray-500` → `text-text-tertiary`

2. **Pre-commit hook:**
   ```bash
   # Warn on hardcoded Tailwind colors
   git diff --cached | grep -E 'bg-(blue|green|red|purple|yellow)-[0-9]'
   ```

3. **Component audit:**
   ```bash
   # Find hardcoded colors
   grep -r "bg-blue-[0-9]" src/features/
   grep -r "bg-purple-[0-9]" src/features/
   ```

---

## 📈 Phase 2 Additions (Coming Soon)

```css
/* Performance trends */
--color-trend-improving: #10B981;
--color-trend-plateau: #F59E0B;
--color-trend-declining: #EF4444;

/* Achievement colors */
--color-achievement-gold: #FBBF24;
--color-achievement-silver: #9CA3AF;
--color-achievement-bronze: #D97706;

/* Expanded status */
--color-success-bg: rgba(16, 185, 129, 0.15);
--color-error-bg: rgba(239, 68, 68, 0.15);
```

---

## 🔍 Testing Checklist

- [ ] All text meets 4.5:1 contrast ratio (WCAG AA)
- [ ] Focus indicators visible on all interactive elements
- [ ] Activity types distinguishable in both themes
- [ ] No hardcoded Tailwind colors in new components
- [ ] Colorblind-safe palette available for charts

---

## 📚 Resources

- **Full Analysis:** `COLOR_SYSTEM_ANALYSIS.md` (54 pages)
- **Theme File:** `src/styles/theme.css`
- **Tailwind Config:** `tailwind.config.js`
- **Chart Colors:** `src/utils/chartDataFormatters.ts`
- **Activity Config:** `src/config/trainingTypeConfig.ts`

---

**Need help?** Refer to Section 8 (Appendix) in `COLOR_SYSTEM_ANALYSIS.md` for code examples.
