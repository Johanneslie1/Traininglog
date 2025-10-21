# Analytics UI Mockup Guide

Visual reference guide for implementing the Progress Tracking Dashboard UI.

---

## 📱 Page Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  ☰  ANALYTICS                                    [← Back]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [7d] [30d] [90d] [1y] [All] [Custom ▼]   [Exercise Filter]│
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Total Vol   │ │  Workouts    │ │  New PRs     │        │
│  │   125,420kg  │ │      42      │ │      8       │        │
│  │   +12% ↑     │ │   +3 this wk │ │   🔥 2 this wk│       │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  📈 VOLUME PROGRESSION                                │  │
│  │                                                        │  │
│  │      [Bench Press ─]  [Squat ─]  [Deadlift ─]       │  │
│  │                                                        │  │
│  │   Volume (kg)                                         │  │
│  │   15k │        ╱─╲                                    │  │
│  │   10k │    ╱──╯   ╲──╮                               │  │
│  │    5k │ ──╯           ╰─                             │  │
│  │       └──────────────────────────►                   │  │
│  │         Jan   Feb   Mar   Apr                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────┐  ┌────────────────────────────┐  │
│  │  🏆 PERSONAL RECORDS │  │  💪 MUSCLE DISTRIBUTION   │  │
│  │                      │  │                            │  │
│  │  Bench Press         │  │         ╱────╲            │  │
│  │  🥇 1RM: 100kg      │  │      ╱────    ╲           │  │
│  │     +5kg (5%) ↑     │  │    ╱    Chest  ╲          │  │
│  │     Oct 15, 2025    │  │   │      30%    │         │  │
│  │                      │  │   │             │         │  │
│  │  Squat               │  │   │  Back 25%   │         │  │
│  │  🥇 1RM: 140kg      │  │    ╲           ╱          │  │
│  │     +10kg (8%) ↑    │  │      ╲  Legs  ╱           │  │
│  │     Oct 12, 2025    │  │         ╲───╱             │  │
│  │                      │  │          20%              │  │
│  │  [View All PRs →]   │  │                            │  │
│  └──────────────────────┘  └────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📅 TRAINING FREQUENCY HEATMAP                      │   │
│  │                                                      │   │
│  │  Mon  ■ ■ ■ □ ■ ■ □  [Streak: 12 days 🔥]         │   │
│  │  Tue  □ ■ ■ ■ □ ■ ■                               │   │
│  │  Wed  ■ □ ■ ■ ■ □ ■                               │   │
│  │  Thu  ■ ■ □ ■ ■ ■ □                               │   │
│  │  Fri  ■ ■ ■ □ □ ■ ■                               │   │
│  │  Sat  □ ■ ■ ■ ■ □ ■                               │   │
│  │  Sun  □ □ ■ □ ■ ■ □                               │   │
│  │       W1 W2 W3 W4 W5 W6                            │   │
│  │                                                      │   │
│  │  ■ High  ■ Moderate  ■ Light  □ Rest               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Component Details

### 1. Header Section
```tsx
<header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
  <div className="flex items-center justify-between px-6 py-4">
    <div className="flex items-center gap-4">
      <button className="lg:hidden">☰</button>
      <h1 className="text-2xl font-bold">Analytics</h1>
    </div>
    <button onClick={() => navigate(-1)}>← Back</button>
  </div>
</header>
```

**Style:**
- Background: `bg-gray-900`
- Sticky positioning
- Border bottom: `border-gray-800`
- Height: `64px`

---

### 2. Filter Bar
```tsx
<div className="bg-gray-800 px-6 py-4 flex flex-wrap gap-3">
  {/* Timeframe Buttons */}
  <div className="flex gap-2">
    <button className={`px-4 py-2 rounded-lg ${active ? 'bg-blue-600' : 'bg-gray-700'}`}>
      7d
    </button>
    {/* ... more buttons */}
  </div>
  
  {/* Exercise Filter */}
  <select className="px-4 py-2 bg-gray-700 rounded-lg">
    <option>All Exercises</option>
    <option>Bench Press</option>
    {/* ... */}
  </select>
</div>
```

**Style:**
- Buttons: Rounded, toggle active state
- Active: `bg-blue-600 text-white`
- Inactive: `bg-gray-700 text-gray-300 hover:bg-gray-600`
- Mobile: Stack vertically

---

### 3. Stats Overview Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-400 text-sm">Total Volume</span>
      <ChartIcon className="w-5 h-5 text-blue-500" />
    </div>
    <div className="text-3xl font-bold mb-1">125,420kg</div>
    <div className="flex items-center text-green-500 text-sm">
      <ArrowUpIcon className="w-4 h-4" />
      <span>+12% from last period</span>
    </div>
  </div>
  {/* More cards... */}
</div>
```

**Style:**
- Card: `bg-gray-800 rounded-xl border border-gray-700`
- Padding: `p-6`
- Value: `text-3xl font-bold`
- Change indicator: Green for increase, red for decrease
- Icon: Top right, colored by metric type

---

### 4. Volume Progression Chart
```tsx
<div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl font-bold flex items-center gap-2">
      📈 Volume Progression
    </h2>
    <button className="text-sm text-blue-500">Export</button>
  </div>
  
  {/* Legend */}
  <div className="flex gap-4 mb-4">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
      <span className="text-sm">Bench Press</span>
    </div>
    {/* More exercises... */}
  </div>
  
  {/* Chart */}
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <Line type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} />
      {/* ... */}
    </LineChart>
  </ResponsiveContainer>
</div>
```

**Chart Style:**
- Grid lines: `stroke="#374151"` (gray-700)
- Line colors: Use distinct colors for each exercise
- Tooltip: Dark background, white text
- Points: Show on hover
- Animation: Smooth entry animation

**Colors for Lines:**
- Exercise 1: `#3b82f6` (blue)
- Exercise 2: `#10b981` (green)
- Exercise 3: `#f59e0b` (amber)
- Exercise 4: `#ef4444` (red)
- Exercise 5: `#8b5cf6` (purple)

---

### 5. Personal Records Display
```tsx
<div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
    🏆 Personal Records
  </h2>
  
  {/* PR List */}
  <div className="space-y-4">
    {records.map(record => (
      <div className="bg-gray-700/50 rounded-lg p-4 border-l-4 border-yellow-500">
        {/* Exercise Name */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{record.exerciseName}</h3>
          <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
            {record.recordType}
          </span>
        </div>
        
        {/* Value */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold">{record.weight}kg</span>
          <span className="text-gray-400">× {record.reps} reps</span>
        </div>
        
        {/* Improvement */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-500 flex items-center gap-1">
            <ArrowUpIcon className="w-4 h-4" />
            +{record.improvement}% improvement
          </span>
          <span className="text-gray-400">{formatDate(record.date)}</span>
        </div>
      </div>
    ))}
  </div>
  
  <button className="w-full mt-4 text-blue-500 hover:text-blue-400">
    View All PRs →
  </button>
</div>
```

**Style:**
- PR Card: `bg-gray-700/50` with colored left border
- Border colors:
  - 1RM: `border-yellow-500` (gold)
  - 3RM: `border-gray-400` (silver)
  - 5RM: `border-orange-600` (bronze)
  - Volume: `border-blue-500`
- Badge: Small, rounded, transparent background
- Animation: Celebration effect for new PRs (last 7 days)

---

### 6. Muscle Volume Distribution
```tsx
<div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl font-bold flex items-center gap-2">
      💪 Muscle Distribution
    </h2>
    <div className="flex gap-2">
      <button className={chartType === 'pie' ? 'active' : ''}>
        Pie
      </button>
      <button className={chartType === 'bar' ? 'active' : ''}>
        Bar
      </button>
    </div>
  </div>
  
  {/* Pie Chart */}
  {chartType === 'pie' && (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={muscleData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {muscleData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={MUSCLE_COLORS[entry.muscleGroup]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )}
  
  {/* Legend */}
  <div className="grid grid-cols-2 gap-2 mt-4">
    {muscleData.map(muscle => (
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: MUSCLE_COLORS[muscle.muscleGroup] }}
        />
        <span className="text-sm">{muscle.muscleGroup}</span>
        <span className="text-sm text-gray-400 ml-auto">{muscle.percentage}%</span>
      </div>
    ))}
  </div>
  
  {/* Balance Warning */}
  {imbalance && (
    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
      <p className="text-sm text-yellow-500">
        ⚠️ Consider adding more {underworkedMuscle} exercises
      </p>
    </div>
  )}
</div>
```

**Muscle Group Colors:**
```typescript
const MUSCLE_COLORS = {
  chest: '#FF6B6B',
  back: '#4ECDC4',
  legs: '#95E1D3',
  shoulders: '#F38181',
  arms: '#AA96DA',
  core: '#FCBAD3',
  fullBody: '#A8E6CF',
};
```

---

### 7. Training Frequency Heatmap
```tsx
<div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl font-bold flex items-center gap-2">
      📅 Training Frequency
    </h2>
    <div className="flex items-center gap-2 text-orange-500">
      🔥 {currentStreak} day streak
    </div>
  </div>
  
  {/* Heatmap Grid */}
  <div className="grid grid-cols-7 gap-2">
    {days.map(day => (
      <div
        key={day.date}
        className={`aspect-square rounded ${getIntensityColor(day.intensity)}`}
        onMouseEnter={() => setHoveredDay(day)}
        onMouseLeave={() => setHoveredDay(null)}
      >
        {/* Day number */}
        <span className="text-xs">{day.dayNumber}</span>
      </div>
    ))}
  </div>
  
  {/* Legend */}
  <div className="flex items-center gap-2 mt-4 text-sm">
    <span className="text-gray-400">Less</span>
    <div className="w-4 h-4 rounded bg-gray-700"></div>
    <div className="w-4 h-4 rounded bg-green-900"></div>
    <div className="w-4 h-4 rounded bg-green-600"></div>
    <div className="w-4 h-4 rounded bg-green-400"></div>
    <div className="w-4 h-4 rounded bg-green-300"></div>
    <span className="text-gray-400">More</span>
  </div>
  
  {/* Hover Tooltip */}
  {hoveredDay && (
    <div className="absolute bg-gray-900 p-3 rounded-lg border border-gray-700 shadow-xl">
      <div className="font-semibold mb-1">{formatDate(hoveredDay.date)}</div>
      <div className="text-sm text-gray-400">
        {hoveredDay.workoutCount} workouts
      </div>
      <div className="text-sm text-gray-400">
        Volume: {hoveredDay.totalVolume}kg
      </div>
    </div>
  )}
</div>
```

**Intensity Color Scale:**
```typescript
function getIntensityColor(intensity: number): string {
  const colors = [
    'bg-gray-700',       // 0: Rest day
    'bg-green-900',      // 1: Light
    'bg-green-700',      // 2: Moderate  
    'bg-green-500',      // 3: High
    'bg-green-300',      // 4: Very High
  ];
  return colors[intensity];
}
```

---

## 📐 Responsive Breakpoints

### Mobile (< 768px)
```css
/* Single column layout */
.stats-grid {
  grid-template-columns: 1fr;
}

.charts-grid {
  grid-template-columns: 1fr;
}

/* Smaller text */
.stat-value {
  font-size: 1.5rem; /* Instead of 3xl */
}

/* Hide some labels */
.chart-label-long {
  display: none;
}
```

### Tablet (768px - 1024px)
```css
/* Two column layout */
.stats-grid {
  grid-template-columns: repeat(2, 1fr);
}

.charts-grid {
  grid-template-columns: 1fr;
}
```

### Desktop (> 1024px)
```css
/* Three column stats */
.stats-grid {
  grid-template-columns: repeat(3, 1fr);
}

/* Two column charts */
.charts-grid {
  grid-template-columns: repeat(2, 1fr);
}

/* Full width for large charts */
.chart-full-width {
  grid-column: span 2;
}
```

---

## 🎭 Animations

### Page Load
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card {
  animation: fadeInUp 0.3s ease-out;
  animation-fill-mode: both;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
```

### PR Celebration (New PRs)
```css
@keyframes celebrate {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.pr-card-new {
  animation: celebrate 0.6s ease-in-out 3;
  border-color: #FFD700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}
```

### Chart Entry
```typescript
// In Recharts components
<Line
  animationDuration={1000}
  animationEasing="ease-in-out"
/>
```

### Hover Effects
```css
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.heatmap-cell:hover {
  transform: scale(1.2);
  z-index: 10;
  transition: transform 0.2s ease;
}
```

---

## 🎨 Loading States

### Skeleton Loader
```tsx
<div className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
  {/* Header skeleton */}
  <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
  
  {/* Chart skeleton */}
  <div className="h-64 bg-gray-700 rounded mb-4"></div>
  
  {/* Legend skeleton */}
  <div className="flex gap-4">
    <div className="h-4 bg-gray-700 rounded w-20"></div>
    <div className="h-4 bg-gray-700 rounded w-20"></div>
    <div className="h-4 bg-gray-700 rounded w-20"></div>
  </div>
</div>
```

---

## 🚫 Empty States

### No Data Available
```tsx
<div className="text-center py-12">
  <div className="text-6xl mb-4">📊</div>
  <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
  <p className="text-gray-400 mb-6">
    Start logging exercises to see your progress here
  </p>
  <button 
    onClick={() => navigate('/')}
    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
  >
    Log Your First Exercise
  </button>
</div>
```

### No PRs Yet
```tsx
<div className="text-center py-8">
  <div className="text-4xl mb-3">🏆</div>
  <p className="text-gray-400">
    Keep training to set your first PR!
  </p>
</div>
```

---

## 🎯 Interactive Elements

### Tooltip Component
```tsx
interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <span className="font-bold">{entry.value}kg</span>
        </div>
      ))}
    </div>
  );
};
```

---

## 📱 Mobile Optimizations

### Touch Interactions
```tsx
// Enable touch scrolling for charts
<ResponsiveContainer width="100%" height={300}>
  <LineChart 
    data={data}
    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
  >
    {/* Enable touch/drag */}
    <Brush dataKey="date" height={30} stroke="#3b82f6" />
  </LineChart>
</ResponsiveContainer>
```

### Swipe Gestures
```tsx
// For switching between chart types
const [touchStart, setTouchStart] = useState(0);
const [touchEnd, setTouchEnd] = useState(0);

const handleTouchStart = (e: React.TouchEvent) => {
  setTouchStart(e.targetTouches[0].clientX);
};

const handleTouchEnd = () => {
  if (touchStart - touchEnd > 50) {
    // Swipe left - next chart
    nextChart();
  }
  if (touchStart - touchEnd < -50) {
    // Swipe right - previous chart
    prevChart();
  }
};
```

---

## 🎨 Accessibility

### Keyboard Navigation
```tsx
<button
  className="stat-card"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleCardClick();
    }
  }}
>
  {/* Card content */}
</button>
```

### ARIA Labels
```tsx
<div 
  role="img" 
  aria-label={`Training intensity for ${formatDate(day.date)}`}
  className="heatmap-cell"
>
  {/* Cell content */}
</div>
```

### Screen Reader Support
```tsx
<div aria-live="polite" className="sr-only">
  {loading ? 'Loading analytics data' : 'Analytics data loaded'}
</div>
```

---

**Version:** 1.0  
**Last Updated:** October 19, 2025  
**Design System:** Tailwind CSS with custom components
