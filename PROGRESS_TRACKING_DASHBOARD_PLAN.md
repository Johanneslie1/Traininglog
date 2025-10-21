# Progress Tracking Dashboard - Implementation Plan

## 📋 Overview
This document outlines the complete implementation plan for a comprehensive Progress Tracking Dashboard featuring volume progression charts, personal records tracking, body part volume analysis, and training frequency heatmaps.

**Estimated Implementation Time:** 3-4 weeks  
**Priority:** High  
**Complexity:** High

---

## 🎯 Features to Implement

### 1. Volume Progression Charts
- **Weight × Reps tracking over time**
- Line charts for individual exercises
- Comparison of multiple exercises
- Timeframe filters (7 days, 30 days, 90 days, 1 year, all time)

### 2. Personal Records (PRs) Tracking
- **Automatic PR detection** for each exercise
- PR categories: 1RM, 3RM, 5RM, max volume, max reps
- PR history timeline
- PR celebration notifications

### 3. Body Part Volume Distribution
- **Pie/bar charts** showing volume distribution across muscle groups
- Weekly/monthly muscle group volume totals
- Balance analysis (push vs pull, upper vs lower)
- Imbalance warnings

### 4. Training Frequency Heatmaps
- **Calendar heatmap** showing workout intensity
- Streak tracking
- Rest day analysis
- Training consistency score

---

## 🏗️ Architecture

### New File Structure
```
src/
├── features/
│   └── analytics/
│       ├── Analytics.tsx                    # Main analytics page
│       ├── components/
│       │   ├── VolumeProgressionChart.tsx   # Volume charts
│       │   ├── PersonalRecordsDisplay.tsx   # PR tracking
│       │   ├── MuscleVolumeDistribution.tsx # Body part analysis
│       │   ├── TrainingHeatmap.tsx          # Frequency heatmap
│       │   ├── StatCard.tsx                 # Reusable stat card
│       │   ├── TimeframeSelector.tsx        # Date range picker
│       │   └── ExerciseSelector.tsx         # Exercise filter
│       └── hooks/
│           ├── useVolumeData.ts             # Volume calculations
│           ├── usePersonalRecords.ts        # PR detection logic
│           ├── useMuscleVolume.ts           # Muscle group analysis
│           └── useTrainingFrequency.ts      # Frequency calculations
├── services/
│   └── analyticsService.ts                  # Data processing service
├── utils/
│   ├── volumeCalculations.ts                # Volume math utilities
│   ├── prDetection.ts                       # PR detection algorithms
│   └── chartDataFormatters.ts               # Chart data transformation
└── types/
    └── analytics.ts                         # Analytics type definitions
```

---

## 📊 Data Models

### Analytics Types (`src/types/analytics.ts`)
```typescript
// Volume data point
export interface VolumeDataPoint {
  date: Date;
  volume: number;           // weight × reps
  totalSets: number;
  averageWeight: number;
  averageReps: number;
  exerciseName: string;
}

// Personal Record
export interface PersonalRecord {
  id: string;
  exerciseName: string;
  exerciseId?: string;
  recordType: PRType;
  value: number;             // weight, reps, or volume
  reps?: number;             // for RM records
  weight?: number;           // for RM records
  volume?: number;           // for volume records
  date: Date;
  previousRecord?: number;
  improvement?: number;      // percentage improvement
}

export enum PRType {
  ONE_REP_MAX = '1RM',
  THREE_REP_MAX = '3RM',
  FIVE_REP_MAX = '5RM',
  MAX_VOLUME = 'Max Volume',
  MAX_REPS = 'Max Reps',
  MAX_WEIGHT = 'Max Weight'
}

// Muscle volume data
export interface MuscleVolumeData {
  muscleGroup: MuscleGroup;
  totalVolume: number;
  totalSets: number;
  exerciseCount: number;
  percentage: number;        // of total volume
}

// Training frequency data
export interface TrainingFrequencyData {
  date: Date;
  workoutCount: number;
  totalVolume: number;
  totalDuration?: number;
  intensity: IntensityLevel;
  exercises: string[];
}

export enum IntensityLevel {
  REST = 0,
  LIGHT = 1,
  MODERATE = 2,
  HIGH = 3,
  VERY_HIGH = 4
}

// Analytics filters
export interface AnalyticsFilters {
  startDate: Date;
  endDate: Date;
  exercises?: string[];
  muscleGroups?: MuscleGroup[];
  activityTypes?: ActivityType[];
}
```

---

## 🔧 Implementation Phases

### **Phase 1: Foundation & Data Services** (Week 1)

#### 1.1 Analytics Service (`src/services/analyticsService.ts`)
```typescript
export class AnalyticsService {
  // Fetch all exercises for a user within date range
  static async getExercisesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    filters?: AnalyticsFilters
  ): Promise<UnifiedExerciseData[]>

  // Calculate volume for an exercise
  static calculateExerciseVolume(exercise: UnifiedExerciseData): number

  // Calculate daily volumes
  static calculateDailyVolumes(
    exercises: UnifiedExerciseData[],
    groupBy: 'exercise' | 'muscle' | 'day'
  ): VolumeDataPoint[]

  // Detect personal records
  static detectPersonalRecords(
    exercises: UnifiedExerciseData[]
  ): PersonalRecord[]

  // Calculate muscle group volumes
  static calculateMuscleVolumes(
    exercises: UnifiedExerciseData[],
    exerciseDatabase: Exercise[]
  ): MuscleVolumeData[]

  // Calculate training frequency
  static calculateTrainingFrequency(
    exercises: UnifiedExerciseData[],
    startDate: Date,
    endDate: Date
  ): TrainingFrequencyData[]
}
```

**Tasks:**
- ✅ Create `analyticsService.ts`
- ✅ Implement volume calculation logic
- ✅ Implement PR detection algorithms
- ✅ Implement muscle group aggregation
- ✅ Add comprehensive unit tests

---

### **Phase 2: Utility Functions** (Week 1)

#### 2.1 Volume Calculations (`src/utils/volumeCalculations.ts`)
```typescript
// Calculate volume for a single set
export function calculateSetVolume(set: ExerciseSet): number {
  return (set.weight || 0) * (set.reps || 0);
}

// Calculate total volume for an exercise
export function calculateTotalVolume(sets: ExerciseSet[]): number {
  return sets.reduce((total, set) => total + calculateSetVolume(set), 0);
}

// Calculate average metrics
export function calculateAverageWeight(sets: ExerciseSet[]): number
export function calculateAverageReps(sets: ExerciseSet[]): number

// Estimate 1RM using Epley formula
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}
```

#### 2.2 PR Detection (`src/utils/prDetection.ts`)
```typescript
// Detect if a new PR was set
export function detectPR(
  currentExercise: UnifiedExerciseData,
  historicalExercises: UnifiedExerciseData[]
): PersonalRecord | null

// Get all PRs for an exercise
export function getExercisePRs(
  exerciseName: string,
  exercises: UnifiedExerciseData[]
): Map<PRType, PersonalRecord>

// Compare two records
export function compareRecords(
  current: PersonalRecord,
  previous: PersonalRecord
): number // percentage improvement
```

#### 2.3 Chart Data Formatters (`src/utils/chartDataFormatters.ts`)
```typescript
// Format data for line charts
export function formatVolumeChartData(
  dataPoints: VolumeDataPoint[]
): ChartDataset[]

// Format data for pie charts
export function formatMuscleDistributionData(
  muscleData: MuscleVolumeData[]
): PieChartData

// Format data for heatmaps
export function formatHeatmapData(
  frequencyData: TrainingFrequencyData[]
): HeatmapCell[]
```

**Tasks:**
- ✅ Create utility files
- ✅ Implement calculation functions
- ✅ Add TypeScript types
- ✅ Write unit tests

---

### **Phase 3: Custom Hooks** (Week 2)

#### 3.1 Volume Data Hook (`src/features/analytics/hooks/useVolumeData.ts`)
```typescript
export function useVolumeData(filters: AnalyticsFilters) {
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch and process volume data
  }, [filters]);

  return { volumeData, loading, error, refetch };
}
```

#### 3.2 Personal Records Hook (`src/features/analytics/hooks/usePersonalRecords.ts`)
```typescript
export function usePersonalRecords(userId: string, exerciseName?: string) {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch and detect PRs
  }, [userId, exerciseName]);

  return { records, loading, refetch };
}
```

#### 3.3 Muscle Volume Hook (`src/features/analytics/hooks/useMuscleVolume.ts`)
```typescript
export function useMuscleVolume(filters: AnalyticsFilters) {
  const [muscleData, setMuscleData] = useState<MuscleVolumeData[]>([]);
  const [loading, setLoading] = useState(true);

  return { muscleData, loading, refetch };
}
```

#### 3.4 Training Frequency Hook (`src/features/analytics/hooks/useTrainingFrequency.ts`)
```typescript
export function useTrainingFrequency(filters: AnalyticsFilters) {
  const [frequencyData, setFrequencyData] = useState<TrainingFrequencyData[]>([]);
  const [loading, setLoading] = useState(true);

  return { frequencyData, loading, refetch };
}
```

**Tasks:**
- ✅ Create custom hooks
- ✅ Implement data fetching logic
- ✅ Add loading and error states
- ✅ Implement caching strategy

---

### **Phase 4: Chart Components** (Week 2)

#### 4.1 Install Chart Library
```bash
npm install recharts
npm install @types/recharts --save-dev
```

**Alternative:** `chart.js` with `react-chartjs-2` or `victory` for React Native compatibility

#### 4.2 Volume Progression Chart (`src/features/analytics/components/VolumeProgressionChart.tsx`)
```tsx
interface VolumeProgressionChartProps {
  data: VolumeDataPoint[];
  selectedExercises: string[];
  timeframe: '7d' | '30d' | '90d' | '1y' | 'all';
}

export const VolumeProgressionChart: React.FC<VolumeProgressionChartProps> = ({
  data,
  selectedExercises,
  timeframe
}) => {
  // Line chart showing volume over time
  // Multiple lines for different exercises
  // Tooltips with detailed info
  // Zoom and pan functionality
}
```

**Features:**
- ✅ Multi-line chart for comparing exercises
- ✅ Interactive tooltips
- ✅ Responsive design
- ✅ Export chart as image

#### 4.3 Personal Records Display (`src/features/analytics/components/PersonalRecordsDisplay.tsx`)
```tsx
interface PersonalRecordsDisplayProps {
  records: PersonalRecord[];
  exerciseName?: string;
}

export const PersonalRecordsDisplay: React.FC<PersonalRecordsDisplayProps> = ({
  records,
  exerciseName
}) => {
  // Display PRs in cards or table
  // Show improvement percentages
  // Timeline view of PR progression
  // Highlight recent PRs (last 30 days)
}
```

**Features:**
- ✅ PR cards with visual indicators
- ✅ Timeline visualization
- ✅ Filter by PR type
- ✅ Celebration animations for new PRs

#### 4.4 Muscle Volume Distribution (`src/features/analytics/components/MuscleVolumeDistribution.tsx`)
```tsx
interface MuscleVolumeDistributionProps {
  muscleData: MuscleVolumeData[];
  chartType: 'pie' | 'bar';
}

export const MuscleVolumeDistribution: React.FC<MuscleVolumeDistributionProps> = ({
  muscleData,
  chartType
}) => {
  // Pie or bar chart showing muscle group distribution
  // Balance indicators
  // Recommendations for underworked muscles
}
```

**Features:**
- ✅ Pie and bar chart views
- ✅ Color-coded muscle groups
- ✅ Percentage labels
- ✅ Balance analysis

#### 4.5 Training Heatmap (`src/features/analytics/components/TrainingHeatmap.tsx`)
```tsx
interface TrainingHeatmapProps {
  frequencyData: TrainingFrequencyData[];
  startDate: Date;
  endDate: Date;
}

export const TrainingHeatmap: React.FC<TrainingHeatmapProps> = ({
  frequencyData,
  startDate,
  endDate
}) => {
  // Calendar heatmap showing training frequency
  // Color intensity based on volume/intensity
  // Click to see day details
  // Streak indicators
}
```

**Features:**
- ✅ GitHub-style calendar heatmap
- ✅ Color gradient based on intensity
- ✅ Hover tooltips with daily stats
- ✅ Streak tracking overlay

**Tasks:**
- ✅ Install chart library
- ✅ Create chart components
- ✅ Style components to match app theme
- ✅ Add responsive layouts
- ✅ Implement interactive features

---

### **Phase 5: Main Analytics Page** (Week 3)

#### 5.1 Analytics Page Layout (`src/features/analytics/Analytics.tsx`)
```tsx
const Analytics: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: subDays(new Date(), 90),
    endDate: new Date()
  });

  const { volumeData, loading: volumeLoading } = useVolumeData(filters);
  const { records, loading: recordsLoading } = usePersonalRecords(user?.id);
  const { muscleData, loading: muscleLoading } = useMuscleVolume(filters);
  const { frequencyData, loading: freqLoading } = useTrainingFrequency(filters);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with filters */}
      <AnalyticsHeader filters={filters} onFilterChange={setFilters} />

      {/* Stats Overview Cards */}
      <StatsOverview 
        volumeData={volumeData}
        records={records}
        muscleData={muscleData}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Volume Progression */}
        <VolumeProgressionChart data={volumeData} />

        {/* Personal Records */}
        <PersonalRecordsDisplay records={records} />

        {/* Muscle Distribution */}
        <MuscleVolumeDistribution muscleData={muscleData} />

        {/* Training Heatmap */}
        <TrainingHeatmap frequencyData={frequencyData} />
      </div>
    </div>
  );
};
```

#### 5.2 Supporting Components

**TimeframeSelector** (`src/features/analytics/components/TimeframeSelector.tsx`)
```tsx
// Button group for selecting date ranges
// Presets: 7d, 30d, 90d, 1y, all time, custom
```

**ExerciseSelector** (`src/features/analytics/components/ExerciseSelector.tsx`)
```tsx
// Multi-select dropdown for filtering by exercise
// Search functionality
// Recently viewed exercises
```

**StatCard** (`src/features/analytics/components/StatCard.tsx`)
```tsx
// Reusable card for displaying key metrics
// Icons, values, change indicators
```

**Tasks:**
- ✅ Create Analytics page component
- ✅ Implement filter system
- ✅ Create supporting components
- ✅ Add loading states
- ✅ Implement error handling

---

### **Phase 6: Navigation & Integration** (Week 3)

#### 6.1 Update Routes (`src/routes.tsx`)
```tsx
import Analytics from '@/features/analytics/Analytics';

// Add route
<Route path="/analytics" element={<Analytics />} />
```

#### 6.2 Update Navigation Menu (`src/components/SideMenu.tsx`)
```tsx
// Add Analytics menu item
<button onClick={() => navigate('/analytics')}>
  <ChartBarIcon />
  <span>Analytics</span>
</button>
```

#### 6.3 Add Quick Links
- Dashboard → Analytics button
- Exercise Log → "View Progress" button for each exercise
- Programs → Progress tracking integration

**Tasks:**
- ✅ Add routes
- ✅ Update navigation
- ✅ Add deep links from other pages
- ✅ Test navigation flow

---

### **Phase 7: PR Detection & Notifications** (Week 4)

#### 7.1 PR Detection Service
```typescript
// Detect PRs in real-time when exercises are logged
export async function detectAndNotifyPRs(
  newExercise: UnifiedExerciseData,
  userId: string
): Promise<PersonalRecord[]>
```

#### 7.2 PR Notifications
```tsx
// Toast notification when PR is detected
import toast from 'react-hot-toast';

toast.success('🎉 New Personal Record!', {
  description: `${exerciseName}: ${weight}kg × ${reps} reps`,
  duration: 5000
});
```

#### 7.3 PR Storage in Firestore
```typescript
// Store PRs in separate collection for quick access
collection: 'personalRecords'
{
  userId: string;
  exerciseName: string;
  recordType: PRType;
  value: number;
  date: Date;
  exerciseLogId: string;
}
```

**Tasks:**
- ✅ Implement real-time PR detection
- ✅ Create notification system
- ✅ Store PRs in database
- ✅ Add PR badges to exercise cards

---

### **Phase 8: Testing & Polish** (Week 4)

#### 8.1 Unit Tests
```typescript
// Test volume calculations
describe('volumeCalculations', () => {
  it('should calculate set volume correctly', () => {
    const set = { weight: 100, reps: 10 };
    expect(calculateSetVolume(set)).toBe(1000);
  });
});

// Test PR detection
describe('prDetection', () => {
  it('should detect new 1RM', () => {
    // Test cases
  });
});
```

#### 8.2 Integration Tests
- Test data fetching and display
- Test filter interactions
- Test chart rendering

#### 8.3 Performance Optimization
- Implement data caching
- Lazy load chart components
- Optimize Firestore queries
- Add pagination for large datasets

#### 8.4 UI/UX Polish
- Smooth animations
- Loading skeletons
- Empty states
- Error boundaries

**Tasks:**
- ✅ Write unit tests (80%+ coverage)
- ✅ Write integration tests
- ✅ Optimize performance
- ✅ Polish UI/UX
- ✅ User testing

---

## 📚 Dependencies

### Required Libraries
```json
{
  "recharts": "^2.10.0",           // Chart library
  "date-fns": "^2.30.0",           // Already installed
  "react-hot-toast": "^2.5.2"      // Already installed
}
```

### Optional Enhancements
```json
{
  "html2canvas": "^1.4.1",         // Export charts as images
  "jspdf": "^2.5.1",               // Export to PDF
  "lodash": "^4.17.21"             // Data manipulation utilities
}
```

---

## 🎨 Design Considerations

### Color Scheme
```css
/* PR Types */
--pr-gold: #FFD700;      /* 1RM */
--pr-silver: #C0C0C0;    /* 3RM */
--pr-bronze: #CD7F32;    /* 5RM */
--pr-blue: #4A90E2;      /* Volume */

/* Muscle Groups */
--chest-color: #FF6B6B;
--back-color: #4ECDC4;
--legs-color: #95E1D3;
--shoulders-color: #F38181;
--arms-color: #AA96DA;

/* Intensity Levels */
--intensity-rest: #1a1a1a;
--intensity-light: #2ecc71;
--intensity-moderate: #f39c12;
--intensity-high: #e74c3c;
--intensity-very-high: #c0392b;
```

### Responsive Breakpoints
- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (2-3 columns)

---

## 🚀 Deployment Checklist

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Performance benchmarks met
- [ ] Mobile responsive
- [ ] Accessibility audit passed
- [ ] Browser compatibility tested
- [ ] Documentation updated
- [ ] User guide created
- [ ] Analytics tracking added
- [ ] Deployed to staging
- [ ] User acceptance testing
- [ ] Deployed to production

---

## 📈 Success Metrics

### Technical Metrics
- Page load time < 2s
- Chart render time < 500ms
- 80%+ test coverage
- No accessibility violations

### User Metrics
- 70%+ users visit analytics page weekly
- Average session duration > 3 minutes
- 90%+ positive feedback
- <5% error rate

---

## 🔮 Future Enhancements

### Phase 2 Features (After Initial Release)
1. **Export & Sharing**
   - Export charts as images
   - Generate PDF reports
   - Share progress on social media

2. **Advanced Analytics**
   - Exercise correlation analysis
   - Injury risk prediction
   - Optimal training volume recommendations
   - Fatigue management insights

3. **Goal Tracking**
   - Set PR goals
   - Volume goals per muscle group
   - Consistency goals
   - Achievement system

4. **Comparison Tools**
   - Compare current vs previous period
   - Compare with other users (anonymized)
   - Strength standards comparison

5. **AI Insights**
   - Personalized training recommendations
   - Plateau detection and solutions
   - Recovery suggestions
   - Program optimization

---

## 📞 Support & Resources

### Documentation Links
- Recharts: https://recharts.org/
- Date-fns: https://date-fns.org/
- Firebase Queries: https://firebase.google.com/docs/firestore/query-data/queries

### Team Contacts
- Lead Developer: [Your Name]
- UI/UX Designer: [Name]
- QA Engineer: [Name]

---

## 📝 Notes

### Implementation Tips
1. **Start with data layer** - Get analytics service working first
2. **Mock data during development** - Speed up UI iteration
3. **Incremental testing** - Test each component independently
4. **Performance first** - Large datasets require optimization
5. **User feedback** - Beta test with power users first

### Known Challenges
1. **Large dataset performance** - Implement pagination and caching
2. **Cross-browser compatibility** - Test charts on all browsers
3. **Mobile optimization** - Charts need careful mobile design
4. **PR detection accuracy** - Handle edge cases (different rep ranges)

---

## ✅ Quick Start Guide

### For Developers
1. Create types in `src/types/analytics.ts`
2. Implement `analyticsService.ts`
3. Create utility functions
4. Build custom hooks
5. Create chart components
6. Build main Analytics page
7. Integrate with app navigation
8. Test thoroughly

### For Testing
1. Log various exercises over multiple days
2. Test PR detection with different weight/rep combinations
3. Verify all charts render correctly
4. Test filters and date ranges
5. Check mobile responsiveness
6. Verify data accuracy

---

**Last Updated:** October 19, 2025  
**Version:** 1.0  
**Status:** Ready for Implementation
