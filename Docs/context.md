## Space-Efficient App Navigation

```
├── Dashboard (Today's workout status)
├── Workout (Start/Continue session)
├── History (Calendar view)
├── Export (Data export)
└── Settings (Profile & preferences)
```

### Bottom Navigation# Training Log App - Development Plan

## Project Overview

Create a mobile-first strength training logging application that allows athletes to efficiently track workouts and provides coaches with analytical insights. The app focuses on simplicity, consistency, and automatic data analysis.

## Core Problem Statement

Current strength training logging methods (Excel, notes, disconnected apps) lack:
- Structured and consistent workout logging
- Exercise categorization (strength, bodyweight, sprint)
- Unilateral/bilateral load tracking
- Automatic load calculations
- Integration with data visualization tools

## App Architecture

### Technology Stack
- **Frontend**: Progressive Web App (PWA) with React
- **Backend**: Firebase Functions (serverless)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Hosting**: Firebase Hosting
- **Offline**: Service Worker + Firestore offline persistence

## User Roles

### 1. Athlete
- Primary app user who logs workouts
- Views personal progress and statistics
- Receives workout notifications

### 2. Coach
- Monitors multiple athletes
- Analyzes training data and trends
- Adjusts programs based on data insights

## Core Features & User Flow

### 1. Authentication & Setup
```
Login/Register → Profile Setup → Choose Role (Athlete/Coach) → Dashboard
```

### 2. Main Dashboard
**Athlete View:**
- Today's workout status (Empty Day / Active Session)
- Quick workout start button
- Recent exercises preview
- Weekly load summary

**Coach View:**
- Athletes overview
- Weekly load comparisons
- Alert notifications for imbalances

### 3. Exercise Database Management

#### Exercise Categories:
- **Chest** (Push-ups, Bench Press, Flies)
- **Arms** (Bicep Curls, Tricep Extensions)
- **Back** (Pull-ups, Rows, Deadlifts)
- **Legs** (Squats, Lunges, Calf Raises)
- **Shoulders** (Overhead Press, Lateral Raises)
- **Core** (Planks, Crunches, Russian Twists)
- **Cardio** (Running, Cycling, Rowing)
- **Full-Body** (Burpees, Thrusters)

#### Exercise Properties:
```json
{
  "id": "unique_id",
  "name": "Exercise Name",
  "category": "chest|arms|back|legs|shoulders|core|cardio|full-body",
  "type": "strength|bodyweight|cardio|sprint|plyometric",
  "lateralization": "unilateral|bilateral",
  "equipment": "barbell|dumbbell|bodyweight|machine",
  "muscleGroups": ["primary", "secondary"],
  "instructions": "How to perform the exercise"
}
```

### 4. Workout Logging Flow

#### Starting a Workout:
```
Dashboard → Start Workout → Select Method:
├── From Program (pre-planned)
├── From Another Day (copy previous)
├── Recent Exercises (quick access)
└── Manual Selection (browse database)
```

#### Exercise Selection:
```
Choose Category → Browse Exercises → Select Exercise → Log Sets
```

#### Set Logging with Copy Function:
```javascript
// Set data structure
{
  "reps": 12,
  "weight": 80, // kg or lbs (for cardio: duration in minutes)
  "distance": 5000, // meters (for cardio only)
  "duration": 1800, // seconds (for cardio)
  "rpe": 8, // Rate of Perceived Exertion (1-10)
  "rir": 2, // Reps in Reserve (strength only)
  "notes": "Felt strong today",
  "rest_time": 90 // seconds
}

// Copy Previous Set Feature
copyPreviousSet() {
  const lastSet = getCurrentExerciseSets().last()
  return {
    ...lastSet,
    notes: "", // Clear notes for new set
    rest_time: lastSet.rest_time // Keep same rest time
  }
}
```

#### Space-Efficient Set Entry:
- **Compact Input Layout**: Weight | Reps | RPE in single row
- **Quick Copy Button**: "+" icon copies previous set values
- **Swipe Actions**: Swipe left to delete set, right to copy
- **Minimal Visual Elements**: Clean, dark theme with essential info only

### 5. Program Management

#### Program Structure:
- Program templates (e.g., "In-season vår 2025", "Andy Galpin")
- Weekly schedules
- Exercise progression tracking
- Load periodization

#### Program Features:
- Copy exercises from previous days
- Template creation and sharing
- Progression tracking
- Load auto-adjustment

### 6. Calendar Integration

#### Features:
- Visual workout history
- Color-coded training intensity
- Easy navigation between dates
- Copy workouts between days

#### Calendar View:
```
- Green dots: Completed workouts
- Yellow dots: Partial workouts
- Red dots: High-intensity sessions
- Empty: Rest days
```

## Data Models (Firestore Collections)

### 1. Users Collection
```javascript
// /users/{userId}
{
  id: "user_id", // Firebase Auth UID
  email: "user@example.com",
  role: "athlete", // or "coach"
  firstName: "John",
  lastName: "Doe",
  preferences: {
    units: "kg", // or "lbs"
    defaultRestTime: 90,
    theme: "dark"
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. Exercises Collection
```javascript
// /exercises/{exerciseId}
{
  id: "exercise_id",
  name: "Bench Press",
  category: "chest",
  type: "strength", // strength|bodyweight|cardio|sprint|plyometric
  lateralization: "bilateral", // unilateral|bilateral
  equipment: "barbell",
  muscleGroups: ["chest", "triceps"],
  isCustom: false, // true if created by user
  createdBy: "user_id", // if custom exercise
  createdAt: timestamp
}
```

### 3. Training Sessions Collection
```javascript
// /users/{userId}/trainingSessions/{sessionId}
{
  id: "session_id",
  date: "2025-06-19",
  startTime: timestamp,
  endTime: timestamp,
  notes: "Great workout today",
  totalVolume: 2400, // calculated
  sessionRPE: 8,
  exerciseCount: 5,
  setCount: 20,
  createdAt: timestamp
}
```

### 4. Exercise Logs Subcollection
```javascript
// /users/{userId}/trainingSessions/{sessionId}/exerciseLogs/{logId}
{
  id: "log_id",
  exerciseId: "exercise_id",
  exerciseName: "Bench Press", // denormalized for queries
  category: "chest", // denormalized for queries
  sets: [
    {
      setNumber: 1,
      reps: 12,
      weight: 80,
      duration: null, // for cardio
      distance: null, // for cardio
      rpe: 8,
      rir: 2,
      notes: "",
      restTime: 90
    }
  ],
  totalVolume: 960, // calculated for this exercise
  createdAt: timestamp
}
```

## Key Calculations

### 1. Training Volume
```javascript
// Per exercise
volume = sets × reps × weight

// Per session
sessionVolume = sum(all exercise volumes)

// Per week
weeklyVolume = sum(all session volumes in week)
```

### 2. Load Factor
```javascript
loadFactor = totalVolume × averageRPE
```

### 3. Unilateral Balance
```javascript
// Compare left vs right for unilateral exercises
balanceRatio = leftSideVolume / rightSideVolume
// Alert if ratio < 0.9 or > 1.1
```

## App Navigation Structure

```
├── Dashboard
│   ├── Today's Workout
│   ├── Quick Stats
│   └── Recent Activity
├── Workouts
│   ├── Start New Workout
│   ├── Workout History
│   └── Templates/Programs
├── Exercises
│   ├── Browse by Category
│   ├── Favorites
│   └── Custom Exercises
├── Progress
│   ├── Charts & Graphs
│   ├── Personal Records
│   └── Load Analysis
├── Calendar
│   ├── Monthly View
│   ├── Weekly Planning
│   └── Copy Workouts
└── Settings
    ├── Profile
    ├── Units (kg/lbs)
    ├── Notifications
    └── Data Export
```

## Mobile App Features

### 1. Offline Capability
- Store workouts locally when offline
- Sync when connection restored
- Cache exercise database

### 2. Quick Actions
- Swipe gestures for common actions
- Voice notes for comments
- Timer integration for rest periods

### 3. Smart Suggestions
- Suggest weights based on previous sessions
- Recommend rest times
- Auto-calculate progression

## Coach Dashboard Features

### 1. Athlete Management
```
├── Athlete List
├── Individual Profiles
├── Training Assignments
└── Progress Comparisons
```

### 2. Analytics Views
- Weekly load comparisons
- Training distribution charts
- Injury risk indicators
- Performance trends

### 3. Communication Tools
- In-app messaging
- Workout feedback
- Program adjustments
- Progress reports

## Integration Requirements

### Power BI Integration
```javascript
// Export format for Power BI
{
  "athlete_id": "uuid",
  "session_date": "2025-06-19",
  "exercise_name": "Bench Press",
  "category": "chest",
  "type": "strength",
  "total_volume": 2400,
  "average_rpe": 8.5,
  "set_count": 4,
  "load_factor": 20160
}
```

## Development Phases

### Phase 1: MVP (4-6 weeks)
- User authentication
- Basic exercise logging
- Simple dashboard
- Exercise database
- Mobile-responsive design

### Phase 2: Enhanced Features (6-8 weeks)
- Calendar integration
- Program templates
- Basic analytics
- Coach dashboard
- Data export

### Phase 3: Advanced Features (8-10 weeks)
- Power BI integration
- Advanced analytics
- Notification system
- Offline capabilities
- Performance optimizations

## Technical Considerations

### 1. Performance
- Lazy loading for large exercise lists
- Efficient data caching
- Optimized database queries
- Image compression for exercise demos

### 2. Security
- Secure password storage
- Data encryption at rest
- API rate limiting
- Input validation and sanitization

### 3. Scalability
- Database indexing strategy
- CDN for static assets
- Horizontal scaling capability
- Microservices architecture consideration

## Success Metrics

### User Engagement
- Daily active users
- Session completion rate
- Exercise logging frequency
- Program adherence rate

### Data Quality
- Consistent logging patterns
- Complete workout data
- Accurate load calculations
- Minimal data entry errors

### Coach Adoption
- Number of athletes per coach
- Dashboard usage frequency
- Program creation rate
- Analysis tool utilization

## Deployment Strategy

### 1. Development Environment
- Local development setup
- Staging environment
- Continuous integration pipeline

### 2. Production Deployment
- Cloud hosting (AWS/Azure/GCP)
- Database clustering
- Load balancing
- Monitoring and logging

### 3. Mobile Deployment
- App store submission
- Progressive Web App deployment
- Update management strategy

This plan provides a comprehensive roadmap for building a professional-grade training log application that addresses the specific needs outlined in your original plan while maintaining focus on simplicity and effectiveness.

## Database Schema (Firestore)

### Collections and Documents

#### 1. users
```typescript
interface User {
  id: string;                   // Firebase Auth UID
  email: string;
  role: 'athlete' | 'coach';
  firstName: string;
  lastName: string;
  birthDate?: string;
  preferences: {
    units: 'kg' | 'lbs';
    defaultRestTime: number;    // in seconds
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
  coachId?: string;            // Reference to coach (for athletes)
  athleteIds?: string[];       // References to athletes (for coaches)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 2. exercises
```typescript
interface Exercise {
  id: string;
  name: string;
  category: 'chest' | 'arms' | 'back' | 'legs' | 'shoulders' | 'core' | 'cardio' | 'full-body';
  type: 'strength' | 'bodyweight' | 'cardio' | 'sprint' | 'plyometric';
  lateralization: 'unilateral' | 'bilateral';
  equipment: 'barbell' | 'dumbbell' | 'bodyweight' | 'machine' | 'kettlebell' | 'cable' | 'other';
  muscleGroups: string[];
  instructions: string;
  videoUrl?: string;
  imageUrl?: string;
  isCustom: boolean;
  createdBy?: string;          // user ID if custom exercise
  defaultRestTime?: number;    // in seconds
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 3. programs
```typescript
interface Program {
  id: string;
  name: string;
  description: string;
  createdBy: string;          // user ID
  type: 'template' | 'active';
  duration: number;           // in weeks
  targetAudience?: string;
  goals?: string[];
  isPublic: boolean;
  weeks: {
    [weekNumber: number]: {
      days: {
        [dayNumber: number]: {
          exercises: ProgramExercise[];
        }
      }
    }
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ProgramExercise {
  exerciseId: string;
  sets: number;
  reps: number | string;     // string for ranges like "8-12"
  weight?: number | string;  // can be percentage of 1RM
  restTime: number;          // in seconds
  notes?: string;
}
```

#### 4. trainingSessions
```typescript
interface TrainingSession {
  id: string;
  userId: string;
  programId?: string;        // if part of a program
  date: string;              // YYYY-MM-DD
  startTime: Timestamp;
  endTime?: Timestamp;
  status: 'planned' | 'in-progress' | 'completed';
  notes?: string;
  metrics: {
    totalVolume: number;
    sessionRPE: number;
    exerciseCount: number;
    setCount: number;
    duration?: number;       // in minutes
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 5. exerciseLogs (subcollection of trainingSessions)
```typescript
interface ExerciseLog {
  id: string;
  exerciseId: string;
  exerciseName: string;      // denormalized for queries
  category: string;          // denormalized for queries
  sets: Set[];
  metrics: {
    totalVolume: number;
    averageRPE: number;
    maxWeight: number;
    totalReps: number;
  };
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Set {
  setNumber: number;
  reps: number;
  weight?: number;
  duration?: number;         // for cardio (seconds)
  distance?: number;         // for cardio (meters)
  rpe?: number;             // Rate of Perceived Exertion (1-10)
  rir?: number;             // Reps in Reserve
  notes?: string;
  restTime: number;         // in seconds
  isWarmup: boolean;
}
```

#### 6. personalRecords
```typescript
interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  type: 'weight' | 'reps' | 'volume' | 'distance' | 'time';
  value: number;
  date: string;             // YYYY-MM-DD
  trainingSessionId: string;
  verified?: boolean;       // coach verification
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Application Structure

```
/app
├── public/
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── videos/
│   ├── locales/          # Internationalization files
│   ├── manifest.json
│   └── index.html
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/      # Shared components
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   └── ...
│   │   ├── layout/      # Layout components
│   │   │   ├── Header/
│   │   │   ├── Footer/
│   │   │   ├── Sidebar/
│   │   │   └── Navigation/
│   │   ├── forms/       # Form-specific components
│   │   └── modals/      # Modal components
│   ├── features/        # Feature-specific modules
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── workouts/
│   │   ├── exercises/
│   │   ├── programs/
│   │   └── analytics/
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API and external services
│   │   ├── api/
│   │   ├── firebase/
│   │   └── analytics/
│   ├── store/         # State management
│   │   ├── slices/
│   │   └── store.ts
│   ├── styles/        # Global styles and themes
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── config/        # Configuration files
│   └── App.tsx        # Root component
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.development
├── .env.production
├── package.json
├── tsconfig.json
└── README.md
```

### Feature Module Structure
Each feature module (e.g., workouts, exercises) follows this structure:
```
/feature
├── components/        # Feature-specific components
├── hooks/            # Feature-specific hooks
├── services/         # Feature-specific services
├── types/            # Feature-specific types
├── utils/            # Feature-specific utilities
└── index.ts          # Public API
```

### Component Structure
Each component follows this structure:
```
/ComponentName
├── ComponentName.tsx      # Component implementation
├── ComponentName.test.tsx # Tests
├── ComponentName.styles.ts # Styled components
└── index.ts              # Public API
```

This structure promotes:
- Modularity and code organization
- Feature isolation
- Easy testing
- Clear separation of concerns
- Scalability
- Reusability of components
- Type safety with TypeScript
- Efficient state management