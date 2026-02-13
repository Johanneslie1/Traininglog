# UI Component Library - Quick Reference Guide

## 🎨 Professional UI Components for TrainingLog App

This guide shows you how to use the new professional UI components to make your app look polished and marketable.

---

## 🔘 Button Component

Professional button with multiple variants and states.

### Import
```tsx
import { Button } from '@/components/ui';
```

### Usage Examples

```tsx
// Primary button (main actions)
<Button variant="primary" size="lg" onClick={handleSave}>
  Save Workout
</Button>

// Secondary button (alternative actions)
<Button variant="secondary" size="md" onClick={handleCancel}>
  Cancel
</Button>

// Ghost button (subtle actions)
<Button variant="ghost" size="sm" onClick={handleEdit}>
  Edit
</Button>

// Danger button (destructive actions)
<Button variant="danger" onClick={handleDelete}>
  Delete Exercise
</Button>

// Success button (positive confirmations)
<Button variant="success" onClick={handleComplete}>
  Mark Complete
</Button>

// With icons
<Button 
  variant="primary"
  leftIcon={<PlusIcon />}
  onClick={handleAdd}
>
  Add Exercise
</Button>

// Loading state
<Button variant="primary" isLoading>
  Saving...
</Button>

// Full width
<Button variant="primary" fullWidth>
  Continue
</Button>
```

### Props
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `isLoading`: boolean - Shows spinner
- `leftIcon`, `rightIcon`: ReactNode - Add icons
- `fullWidth`: boolean - Full container width
- All standard button props (onClick, disabled, etc.)

---

## 🎯 Floating Action Button (FAB)

Eye-catching button for primary app actions.

### Import
```tsx
import { FloatingActionButton } from '@/components/ui';
```

### Usage Examples

```tsx
// Bottom right (default)
<FloatingActionButton
  onClick={() => setShowLogOptions(true)}
  label="Add Exercise"
/>

// Bottom center
<FloatingActionButton
  onClick={handleAdd}
  label="Start Workout"
  position="bottom-center"
/>

// With custom icon
<FloatingActionButton
  onClick={handleAdd}
  icon={<CustomIcon />}
  position="bottom-right"
/>
```

### Props
- `onClick`: () => void
- `label`: string - For accessibility
- `position`: 'bottom-right' | 'bottom-center' | 'bottom-left'
- `icon`: ReactNode - Custom icon (defaults to +)

### Best Practices
- Use for THE primary action (logging, adding, starting)
- Only one FAB per page
- Position: bottom-right for most apps
- Avoid on pages with bottom navigation conflict

---

## 💀 Skeleton Loaders

Professional loading placeholders that match your content shape.

### Import
```tsx
import { Skeleton, ExerciseCardSkeleton, ExerciseListSkeleton } from '@/components/ui';
```

### Usage Examples

```tsx
// Text skeleton
<Skeleton variant="text" width="80%" />

// Circular (for avatars)
<Skeleton variant="circular" width="40px" height="40px" />

// Rectangular
<Skeleton variant="rectangular" width="100%" height="120px" />

// Card skeleton
<Skeleton variant="card" />

// Multiple items
<Skeleton variant="text" count={3} />

// Preset exercise card skeleton
{loading ? (
  <ExerciseCardSkeleton />
) : (
  <ExerciseCard data={exercise} />
)}

// Preset exercise list skeleton
{loading ? (
  <ExerciseListSkeleton count={3} />
) : (
  exercises.map(ex => <ExerciseCard key={ex.id} data={ex} />)
)}
```

### Props
- `variant`: 'text' | 'circular' | 'rectangular' | 'card'
- `width`, `height`: string
- `count`: number - Multiple skeletons

### Best Practices
- Match skeleton shape to actual content
- Use preset skeletons (ExerciseCardSkeleton) when available
- Show during data fetching, not route transitions
- Keep count realistic (3-5 items)

---

## 📭 Empty State Component

Engaging empty states with clear calls-to-action.

### Import
```tsx
import { EmptyState } from '@/components/ui';
```

### Usage Examples

```tsx
// Basic empty state
<EmptyState
  title="No exercises logged"
  description="Start tracking your workouts to see progress"
  primaryAction={{
    label: 'Log Exercise',
    onClick: () => openLogDialog()
  }}
/>

// With illustration
<EmptyState
  illustration="workout"
  title="Ready to Track Your Workout?"
  description="Start logging to see your progress, track PRs, and build consistency"
  primaryAction={{
    label: 'Log First Exercise',
    onClick: handleAdd
  }}
  secondaryAction={{
    label: 'Browse Programs',
    onClick: () => navigate('/programs')
  }}
/>

// Available illustrations
<EmptyState illustration="workout" ... />
<EmptyState illustration="calendar" ... />
<EmptyState illustration="chart" ... />
<EmptyState illustration="search" ... />

// Custom icon
<EmptyState
  icon={<CustomIcon />}
  title="No results found"
  description="Try adjusting your filters"
/>
```

### Props
- `title`: string - Main heading
- `description`: string - Supporting text
- `illustration`: 'workout' | 'calendar' | 'chart' | 'search'
- `icon`: ReactNode - Custom icon
- `primaryAction`: { label: string, onClick: () => void }
- `secondaryAction`: { label: string, onClick: () => void }

### Best Practices
- Always include a primary action
- Keep title short (4-8 words)
- Description should guide to action
- Use illustrations for first-time experiences
- Use icons for filtered/search results

---

## 🃏 Card Component

Elevated cards for grouping content.

### Import
```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';
```

### Usage Examples

```tsx
// Basic card
<Card variant="raised">
  <div className="p-4">
    <h3>Exercise Name</h3>
    <p>3 sets × 12 reps</p>
  </div>
</Card>

// Card variants
<Card variant="flat">Flat card with border</Card>
<Card variant="raised">Raised card with shadow</Card>
<Card variant="elevated">Highly elevated card</Card>

// Interactive card
<Card 
  variant="raised"
  interactive
  onClick={() => navigate('/details')}
>
  Clickable content
</Card>

// Structured card
<Card variant="raised">
  <CardHeader>
    <h3 className="text-heading-lg">Bench Press</h3>
    <p className="text-body-sm text-text-secondary">Chest</p>
  </CardHeader>
  
  <CardBody>
    <div className="space-y-2">
      <p>Set 1: 12 reps × 60kg</p>
      <p>Set 2: 10 reps × 60kg</p>
      <p>Set 3: 8 reps × 60kg</p>
    </div>
  </CardBody>
  
  <CardFooter>
    <Button variant="ghost" size="sm">Edit</Button>
    <Button variant="ghost" size="sm">Delete</Button>
  </CardFooter>
</Card>
```

### Props
- `variant`: 'flat' | 'raised' | 'elevated'
- `interactive`: boolean - Hover effects
- `onClick`: () => void - Makes card clickable

### Best Practices
- Use 'raised' for most content cards
- Use 'elevated' for modals, important overlays
- Use 'flat' for list items, inline content
- Add `interactive` for clickable cards
- Use sub-components for structured data

---

## 📝 Typography Scale

Professional text hierarchy using Tailwind classes.

### Usage Examples

```tsx
// Display text (hero sections, dashboards)
<h1 className="text-display-lg">Training Dashboard</h1>
<h2 className="text-display-md">Weekly Summary</h2>
<h3 className="text-display-sm">Your Progress</h3>

// Headings (sections, cards)
<h4 className="text-heading-lg">Exercise Log</h4>
<h5 className="text-heading-md">Today's Workout</h5>
<h6 className="text-heading-sm">Set Details</h6>

// Body text
<p className="text-body-lg">Main content text, readability first</p>
<p className="text-body-md">Secondary content, descriptions</p>
<p className="text-body-sm">Captions, metadata, timestamps</p>

// Labels and buttons
<label className="text-label">Weight (kg)</label>
<button className="text-button">Save</button>
```

### Size Reference
- `text-display-lg`: 48px - Hero titles
- `text-display-md`: 36px - Page titles
- `text-display-sm`: 30px - Section headers
- `text-heading-lg`: 24px - Card titles
- `text-heading-md`: 20px - Subheadings
- `text-heading-sm`: 18px - Small headers
- `text-body-lg`: 16px - Main content
- `text-body-md`: 14px - Secondary content
- `text-body-sm`: 12px - Captions
- `text-label`: 14px - Form labels
- `text-button`: 14px - Button text

---

## 🎬 Animation Classes

Built-in animations for smooth interactions.

### Usage Examples

```tsx
// Fade in on mount
<div className="animate-fade-in">
  Content appears smoothly
</div>

// Slide up from bottom
<div className="animate-slide-up">
  Modal slides up
</div>

// Slide in from right
<div className="animate-slide-in-right">
  Drawer slides in
</div>

// Scale in
<div className="animate-scale-in">
  Popup scales from center
</div>

// Subtle bounce
<div className="animate-bounce-subtle">
  Gentle attention grabber
</div>

// Active state (add to buttons/cards)
<button className="active:scale-95 transition-transform">
  Scales down on press
</button>

// Hover effect
<div className="hover:scale-105 transition-transform">
  Grows slightly on hover
</div>
```

### Animation Reference
- `animate-fade-in`: Fade in opacity
- `animate-slide-up`: Slide up from bottom
- `animate-slide-in-right`: Slide in from right
- `animate-scale-in`: Scale from 90% to 100%
- `animate-bounce-subtle`: Gentle bounce (not bouncing ball)
- `animate-spin-slow`: Slow rotation (3s)

---

## 🎨 Color System

Semantic colors that work with your theme.

### Background Colors
```tsx
<div className="bg-bg-primary">Dark base background (#1a1a1a)</div>
<div className="bg-bg-secondary">Raised surface (#2d2d2d)</div>
<div className="bg-bg-tertiary">Elevated surface (#3a3a3a)</div>
<div className="bg-bg-quaternary">Overlay background</div>
```

### Text Colors
```tsx
<p className="text-text-primary">Primary text (white)</p>
<p className="text-text-secondary">Secondary text (gray-300)</p>
<p className="text-text-tertiary">Tertiary text (gray-500)</p>
<p className="text-text-muted">Muted text (gray-600)</p>
```

### Accent Colors
```tsx
<button className="bg-accent-primary">Purple primary (#8B5CF6)</button>
<button className="bg-accent-secondary hover:bg-accent-secondary">Purple hover</button>
```

### Status Colors
```tsx
<div className="bg-green-600">Success state</div>
<div className="bg-red-600">Error state</div>
<div className="bg-yellow-600">Warning state</div>
<div className="bg-blue-600">Info state</div>
```

---

## 🎯 Best Practices

### Visual Hierarchy
1. **One clear focal point per screen**
   - Use `text-display-md` or larger for page titles
   - Use `text-heading-lg` for primary content sections

2. **Consistent spacing**
   - Use `space-y-4` (16px) for stacked content
   - Use `gap-3` (12px) for inline elements
   - Use `p-4` (16px) for card padding

3. **Elevation system**
   - Flat: List items, inline content
   - Raised: Content cards, exercises
   - Elevated: Modals, dialogs, important overlays

### Performance
1. **Use skeletons, not spinners**
   - Match skeleton shape to content
   - Show 3-5 skeleton items max

2. **Lazy load heavy components**
   - Charts, images, complex lists

3. **Optimize animations**
   - Use `transform` and `opacity` (GPU-accelerated)
   - Keep durations 200-300ms

### Accessibility
1. **Touch targets: 44px minimum**
   - Use `min-h-[44px]` on buttons
   - All button sizes meet this standard

2. **Color contrast**
   - Text on bg-primary: WCAG AA compliant
   - Use semantic colors for status

3. **Keyboard navigation**
   - All interactive elements focusable
   - Visible focus states

---

## 🚀 Quick Wins

### Replace This:
```tsx
// Old loading spinner
{loading && (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2">
  </div>
)}
```

### With This:
```tsx
// Professional skeleton
{loading ? (
  <ExerciseListSkeleton count={3} />
) : (
  <ExerciseList exercises={exercises} />
)}
```

---

### Replace This:
```tsx
// Old empty state
{items.length === 0 && (
  <div>
    <p>No items</p>
    <button onClick={add}>Add</button>
  </div>
)}
```

### With This:
```tsx
// Engaging empty state
{items.length === 0 && (
  <EmptyState
    illustration="workout"
    title="No Items Yet"
    description="Get started by adding your first item"
    primaryAction={{
      label: 'Add Item',
      onClick: handleAdd
    }}
  />
)}
```

---

### Replace This:
```tsx
// Old button
<button className="px-4 py-2 bg-blue-600 text-white rounded">
  Save
</button>
```

### With This:
```tsx
// Professional button
<Button variant="primary" size="md">
  Save
</Button>
```

---

## 📊 Component Usage Stats

After implementing these components throughout your app:

### Before
- 🔴 Load time feel: Jarring (spinners)
- 🔴 Empty states: Unmotivating
- 🔴 Visual hierarchy: Unclear
- 🔴 Touch targets: Too small (< 40px)
- 🔴 Animations: None or basic

### After
- ✅ Load time feel: Smooth (skeletons)
- ✅ Empty states: Engaging with clear CTAs
- ✅ Visual hierarchy: Professional typography
- ✅ Touch targets: Comfortable (44px+)
- ✅ Animations: Polished micro-interactions

---

## 🎓 Further Resources

### Design Inspiration
- **Strong App**: Best-in-class button design
- **Hevy**: Card elevation and spacing
- **Apple HIG**: Touch target standards
- **Material Design 3**: Animation guidelines

### Development
- Tailwind CSS Docs: https://tailwindcss.com
- React Docs: https://react.dev
- Accessibility: https://www.w3.org/WAI/WCAG21/quickref/

---

**Created:** February 13, 2026  
**Version:** 1.0  
**Author:** TrainingLog UI Team
