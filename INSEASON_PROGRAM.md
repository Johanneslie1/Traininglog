# In-season Full Body AB & C Program - Implementation Summary

## Overview
Added "In-season Full Body AB & C" as a built-in training program designed specifically for in-season athletes to maintain strength and power while managing training fatigue and recovery.

## Program Details

### In-season Full Body AB & C
- **Program ID**: `default-program-inseason-abc`
- **Sessions**: 3 (Session A, B, C)
- **Total Exercises**: 32 exercises across all sessions
- **Target Level**: Intermediate to Advanced (In-season athletes)
- **Activity Type**: Resistance Training
- **Tags**: in-season, full-body, strength-maintenance, power, recovery, built-in

## Program Philosophy

This program is specifically designed for **in-season athletes** who need to:
- Maintain strength and power during competitive season
- Manage fatigue and recovery
- Prevent deconditioning without interfering with sport performance
- Balance training stress with competition demands

## Session Breakdown

### Session A - Strength Maintenance (10 exercises)
**Focus**: Maintain strength levels with adequate rest periods

| Exercise | Sets x Reps | Rest Period |
|----------|-------------|-------------|
| Power Clean (Hang Position) | 4 x 3 | 2-3 min |
| Front Squat | 4 x 5 | 2-3 min |
| Barbell RDL | 3 x 6 | 2 min |
| Barbell Hip Thrust | 3 x 8 | 90 sec |
| Bench Press | 3 x 6 | Minimal |
| Pull-Ups | 3 x 6-8 | 2 min |
| Seated Shoulder Press | 3 x 8 | Minimal |
| Seated Chest Supported Cable Row | 3 x 10 | 90 sec |
| Calf Raises | 3 x 12-15 | 60 sec |
| Tibialis Curls | 3 sets | - |

**Key Features**:
- Moderate to heavy loads (3-8 rep range)
- Adequate rest for quality performance (2-3 min for main lifts)
- Full body coverage with compound movements
- Focus on maintaining strength without excessive fatigue

### Session B - Power & Explosiveness (10 exercises)
**Focus**: Develop and maintain explosive power

| Exercise | Sets x Reps | Rest Period |
|----------|-------------|-------------|
| Power Clean (Blocks/Hang) | 5 x 2 | 2-3 min |
| Box Jumps | 4 x 4 | 2-3 min |
| Front Squat (Speed Emphasis) | 4 x 3 | 2 min |
| Barbell Hip Thrust (Explosive) | 3 x 6 | Minimal |
| Medicine Ball Rotational Throws | 3 x 6 each | 90 sec |
| Push Press | 3 x 5 | Minimal |
| Bent Over Row | 3 x 6 | 2 min |
| Bench Press (Dynamic Effort) | 3 x 5 | 90 sec |
| Calf Raises (Explosive) | 3 x 10 | 60 sec |
| Tibialis Raises | 3 x 12 | 60 sec |

**Key Features**:
- Low reps with explosive intent (2-6 reps)
- Plyometric and ballistic movements
- Speed emphasis on traditional lifts
- Power maintenance for athletic performance

### Session C - Recovery & Volume (12 exercises)
**Focus**: Active recovery with lighter loads and higher volume

| Exercise | Sets x Reps | Rest Period |
|----------|-------------|-------------|
| Pogo Jumps | 3 x 10 | 90 sec |
| Squat Jumps (Light/Bodyweight) | 3 x 5 | Full recovery |
| Single Leg RDL (Light) | 3 x 8 each | 60 sec |
| Bulgarian Split Squats (Light) | 3 x 8 each | 60 sec |
| DB Bench Press | 3 x 10 | Minimal |
| Pull-Ups or Lat Pulldown | 3 x 10 | 90 sec |
| Seated DB Shoulder Press | 3 x 10 | Minimal |
| Seated Cable Row | 3 x 12 | 90 sec |
| DB Bicep Curls | 2 x 12 | Minimal |
| Tricep Extensions | 2 x 12 | 60 sec |
| Calf Raises | 2 x 15 | 60 sec |
| Tibialis Work | 2 x 15 | 60 sec |

**Key Features**:
- Light loads with higher reps (8-15 reps)
- Unilateral work for balance and injury prevention
- Accessory/isolation work
- Promotes recovery while maintaining training stimulus
- Lower overall training stress

## Training Prescription Details

### Sets and Reps Included
All exercises include specific training prescriptions in the notes field:
- **Sets**: Clearly specified (2-5 sets)
- **Reps**: Target rep ranges provided
- **Rest Periods**: Specific rest intervals for optimal recovery

### Rest Period Categories
1. **Full Recovery / 2-3 min**: For power and heavy strength work
2. **2 min**: For compound strength exercises
3. **90 sec**: For moderate intensity work
4. **60 sec**: For accessory and isolation exercises
5. **Minimal**: For supersets or circuit-style training

## Exercise Categories

### Olympic Lifts & Power
- Power Clean (Hang Position)
- Power Clean (Blocks/Hang)
- Box Jumps
- Pogo Jumps
- Squat Jumps
- Medicine Ball Rotational Throws

### Main Strength Exercises
- Front Squat
- Front Squat (Speed Emphasis)
- Barbell RDL
- Barbell Hip Thrust
- Bench Press
- Pull-Ups

### Explosive Variations
- Barbell Hip Thrust (Explosive)
- Bench Press (Dynamic Effort)
- Calf Raises (Explosive)
- Push Press

### Unilateral & Stabilization
- Single Leg RDL (Light)
- Bulgarian Split Squats (Light)

### Accessory Work
- Seated Shoulder Press
- Seated DB Shoulder Press
- Bent Over Row
- Seated Cable Row
- Seated Chest Supported Cable Row
- DB Bicep Curls
- Tricep Extensions

### Lower Leg Specialization
- Calf Raises (various intensities)
- Tibialis Curls
- Tibialis Raises
- Tibialis Work

## Programming Rationale

### Session A (Strength Day)
- **When**: Early in the week, furthest from competition
- **Load**: 70-85% of 1RM
- **Volume**: Moderate (3-4 sets)
- **Goal**: Maintain maximal strength

### Session B (Power Day)
- **When**: Mid-week
- **Load**: 50-70% of 1RM (explosive movements)
- **Volume**: Moderate to High (3-5 sets)
- **Goal**: Develop rate of force development

### Session C (Recovery Day)
- **When**: Later in week or post-competition
- **Load**: 50-65% of 1RM
- **Volume**: Higher reps, lower sets
- **Goal**: Active recovery, prevent detraining

## Weekly Schedule Suggestions

### Option 1: 3 Days/Week
- Monday: Session A (Strength)
- Wednesday: Session B (Power)
- Friday: Session C (Recovery)

### Option 2: Competition Weekend
- Monday: Session A (Strength)
- Wednesday: Session C (Recovery)
- Friday: Session B (Power - if early competition)
- Saturday/Sunday: Competition

### Option 3: Mid-week Competition
- Monday: Session C (Recovery)
- Wednesday: Competition
- Friday: Session A (Strength)
- Sunday: Session B (Power)

## Implementation Details

### File Modified
- `src/config/defaultPrograms.ts`

### Code Structure
```typescript
const inSeasonASession: ProgramSession = {
  notes: 'Focus on strength maintenance with adequate rest periods',
  exercises: [/* 10 exercises with specific notes */]
}

const inSeasonBSession: ProgramSession = {
  notes: 'Power and explosive emphasis',
  exercises: [/* 10 exercises with specific notes */]
}

const inSeasonCSession: ProgramSession = {
  notes: 'Recovery session with lighter loads and higher volume',
  exercises: [/* 12 exercises with specific notes */]
}
```

### Exercise Notes Format
Each exercise includes training prescriptions in the notes:
```
"4 sets x 3 reps, 2-3 min rest"
"3 sets x 6-8 reps, 2 min rest"
"3 sets x 10 reps, Minimal rest"
```

## Key Features

### Built-in Program Benefits
- ✅ Automatically available to all users
- ✅ Cannot be edited or deleted
- ✅ Displays "Built-in" badge
- ✅ Professional training prescriptions included
- ✅ Session-specific notes for training focus

### Athlete-Specific Design
- ✅ In-season periodization
- ✅ Fatigue management
- ✅ Sport performance compatibility
- ✅ Flexible scheduling
- ✅ Recovery emphasis

## Exercise Name Matching

All exercise names are descriptive and match common gym terminology:
- **Power Clean (Hang Position)** - Olympic lift variation
- **Front Squat** - Barbell front-loaded squat
- **Barbell RDL** - Romanian Deadlift
- **Box Jumps** - Plyometric jump training
- **Medicine Ball Rotational Throws** - Rotational power
- **DB Bench Press** - Dumbbell pressing variation
- And many more...

## User Experience

### What Users See
1. Program appears in programs list with "Built-in" badge
2. Three sessions (A, B, C) clearly labeled
3. Each exercise shows specific sets, reps, and rest periods in notes
4. Session notes explain the training focus

### How to Use
1. Navigate to Programs section
2. Select "In-season Full Body AB & C"
3. View sessions and exercises
4. Use as template for workout logging
5. Follow prescribed sets, reps, and rest periods

## Training Tips (for documentation)

### For Coaches/Athletes
- **Adjust based on competition schedule**: Move sessions around based on when competitions occur
- **Monitor fatigue**: If feeling overly fatigued, skip Session B or reduce loads
- **Nutrition and sleep**: Critical for recovery during in-season
- **Warm-up**: Always include sport-specific warm-up before lifting
- **Cool-down**: Light cardio and stretching post-workout

### Load Recommendations
- **Session A**: 70-85% of 1RM for main lifts
- **Session B**: 50-70% of 1RM with maximal velocity
- **Session C**: 50-65% of 1RM with controlled tempo

## Abbreviations Used
- **DB**: Dumbbell
- **RDL**: Romanian Deadlift
- **COD**: Change of Direction

## Integration Status
✅ Added to DEFAULT_PROGRAMS array
✅ Program ID: `default-program-inseason-abc`
✅ Session IDs: `default-inseason-a`, `default-inseason-b`, `default-inseason-c`
✅ All exercises have unique IDs
✅ Training prescriptions in exercise notes
✅ Session-level notes for training focus
✅ No TypeScript errors
✅ Successfully compiles and runs

## Total Built-in Programs
The app now has **5 built-in programs**:
1. Phase 1: Building the Foundations
2. Phase 2: Creating Strength
3. Phase 3: Developing Power and Speed
4. Full Body ABC
5. **In-season Full Body AB & C** ⭐ NEW
