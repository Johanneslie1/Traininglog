import { Program, ProgramSession } from '@/types/program';
import { ActivityType } from '@/types/activityTypes';

/**
 * Default built-in training programs
 * These are starter programs available to all users
 */

// Phase 1: Building the Foundations (Weeks 1-4)
const phase1Session1: ProgramSession = {
  id: 'default-phase1-session1',
  name: 'Session 1',
  userId: 'system',
  order: 0,
  exercises: [
    { id: 'default-goblet-squat', name: 'Goblet Squat', activityType: ActivityType.RESISTANCE, order: 0 },
    { id: 'default-db-floor-press', name: 'DB Floor Press', activityType: ActivityType.RESISTANCE, order: 1 },
    { id: 'default-sa-db-bent-over-row', name: 'SA DB Bent Over Row', activityType: ActivityType.RESISTANCE, order: 2 },
    { id: 'default-rdl', name: 'RDL', activityType: ActivityType.RESISTANCE, order: 3 },
    { id: 'default-single-leg-bridge', name: 'Single Leg Bridge', activityType: ActivityType.RESISTANCE, order: 4 },
    { id: 'default-shoulder-taps', name: 'Shoulder Taps', activityType: ActivityType.RESISTANCE, order: 5 },
    { id: 'default-deadbug', name: 'Deadbug', activityType: ActivityType.RESISTANCE, order: 6 },
  ],
};

const phase1Session2: ProgramSession = {
  id: 'default-phase1-session2',
  name: 'Session 2',
  userId: 'system',
  order: 1,
  exercises: [
    { id: 'default-split-squat', name: 'Split Squat', activityType: ActivityType.RESISTANCE, order: 0 },
    { id: 'default-db-z-press', name: 'DB Z Press', activityType: ActivityType.RESISTANCE, order: 1 },
    { id: 'default-pull-up', name: 'Pull Up', activityType: ActivityType.RESISTANCE, order: 2 },
    { id: 'default-landmine-press', name: 'Landmine Press', activityType: ActivityType.RESISTANCE, order: 3 },
    { id: 'default-banded-triple-threat', name: 'Banded Triple Threat', activityType: ActivityType.RESISTANCE, order: 4 },
    { id: 'default-aleknas', name: 'Aleknas', activityType: ActivityType.RESISTANCE, order: 5 },
    { id: 'default-suitcase-carries', name: 'Suitcase Carries', activityType: ActivityType.RESISTANCE, order: 6 },
  ],
};

const phase1Session3: ProgramSession = {
  id: 'default-phase1-session3',
  name: 'Session 3',
  userId: 'system',
  order: 2,
  exercises: [
    { id: 'default-reverse-lunge', name: 'Reverse Lunge', activityType: ActivityType.RESISTANCE, order: 0 },
    { id: 'default-single-leg-rdl', name: 'Single Leg RDL', activityType: ActivityType.RESISTANCE, order: 1 },
    { id: 'default-palof-press', name: 'Palof Press', activityType: ActivityType.RESISTANCE, order: 2 },
    { id: 'default-half-kneeling-shoulder-press', name: 'Half Kneeling Shoulder Press', activityType: ActivityType.RESISTANCE, order: 3 },
    { id: 'default-banded-pullaparts', name: 'Banded Pullaparts', activityType: ActivityType.RESISTANCE, order: 4 },
    { id: 'default-copenhagen-holds', name: 'Copenhagen Holds', activityType: ActivityType.RESISTANCE, order: 5 },
    { id: 'default-plate-pull-throughs', name: 'Plate Pull Throughs', activityType: ActivityType.RESISTANCE, order: 6 },
  ],
};

// Phase 2: Creating Strength (Weeks 5-8)
const phase2Session1: ProgramSession = {
  id: 'default-phase2-session1',
  name: 'Session 1',
  userId: 'system',
  order: 0,
  exercises: [
    { id: 'default-back-squat', name: 'Back Squat', activityType: ActivityType.RESISTANCE, order: 0 },
    { id: 'default-rdl', name: 'RDL', activityType: ActivityType.RESISTANCE, order: 1 },
    { id: 'default-banded-deadbugs', name: 'Banded Deadbugs', activityType: ActivityType.RESISTANCE, order: 2 },
    { id: 'default-strict-press', name: 'Strict Press', activityType: ActivityType.RESISTANCE, order: 3 },
    { id: 'default-bent-over-row', name: 'Bent Over Row', activityType: ActivityType.RESISTANCE, order: 4 },
    { id: 'default-hollow-holds', name: 'Hollow Holds', activityType: ActivityType.RESISTANCE, order: 5 },
    { id: 'default-side-plank', name: 'Side Plank', activityType: ActivityType.RESISTANCE, order: 6 },
  ],
};

const phase2Session2: ProgramSession = {
  id: 'default-phase2-session2',
  name: 'Session 2',
  userId: 'system',
  order: 1,
  exercises: [
    { id: 'default-ffe-split-squat', name: 'FFE Split Squat', activityType: ActivityType.RESISTANCE, order: 0 },
    { id: 'default-db-floor-press', name: 'DB Floor Press', activityType: ActivityType.RESISTANCE, order: 1 },
    { id: 'default-pull-up', name: 'Pull Up', activityType: ActivityType.RESISTANCE, order: 2 },
    { id: 'default-lateral-lunge', name: 'Lateral Lunge', activityType: ActivityType.RESISTANCE, order: 3 },
    { id: 'default-single-leg-bridge', name: 'Single Leg Bridge', activityType: ActivityType.RESISTANCE, order: 4 },
    { id: 'default-straight-arm-situps', name: 'Straight Arm Sit ups', activityType: ActivityType.RESISTANCE, order: 5 },
    { id: 'default-suitcase-carries', name: 'Suitcase Carries', activityType: ActivityType.RESISTANCE, order: 6 },
  ],
};

const phase2Session3: ProgramSession = {
  id: 'default-phase2-session3',
  name: 'Session 3',
  userId: 'system',
  order: 2,
  exercises: [
    { id: 'default-reverse-lunge', name: 'Reverse Lunge', activityType: ActivityType.RESISTANCE, order: 0 },
    { id: 'default-single-leg-rdl', name: 'Single Leg RDL', activityType: ActivityType.RESISTANCE, order: 1 },
    { id: 'default-palof-rotations', name: 'Palof Rotations', activityType: ActivityType.RESISTANCE, order: 2 },
    { id: 'default-weighted-press-ups', name: 'Weighted Press Ups', activityType: ActivityType.RESISTANCE, order: 3 },
    { id: 'default-face-pull', name: 'Face Pull', activityType: ActivityType.RESISTANCE, order: 4 },
    { id: 'default-bird-dogs', name: 'Bird Dogs', activityType: ActivityType.RESISTANCE, order: 5 },
  ],
};

// Phase 3: Developing Power and Speed (Weeks 9-12)
const phase3Session1: ProgramSession = {
  id: 'default-phase3-session1',
  name: 'Session 1',
  userId: 'system',
  order: 0,
  exercises: [
    { id: 'default-back-squat', name: 'Back Squat', activityType: ActivityType.RESISTANCE, order: 0 },
    { id: 'default-cmj', name: 'CMJ', activityType: ActivityType.RESISTANCE, order: 1 },
    { id: 'default-db-split-jerk', name: 'DB Split Jerk', activityType: ActivityType.RESISTANCE, order: 2 },
    { id: 'default-band-pullaparts', name: 'Band Pullaparts', activityType: ActivityType.RESISTANCE, order: 3 },
    { id: 'default-reverse-lunge', name: 'Reverse Lunge', activityType: ActivityType.RESISTANCE, order: 4 },
    { id: 'default-deadbugs', name: 'Deadbugs', activityType: ActivityType.RESISTANCE, order: 5 },
    { id: 'default-side-plank', name: 'Side Plank', activityType: ActivityType.RESISTANCE, order: 6 },
  ],
};

const phase3Session2: ProgramSession = {
  id: 'default-phase3-session2',
  name: 'Session 2',
  userId: 'system',
  order: 1,
  exercises: [
    { id: 'default-step-ups', name: 'Step Ups', activityType: ActivityType.RESISTANCE, order: 0 },
    { id: 'default-step-up-jumps', name: 'Step Up Jumps', activityType: ActivityType.RESISTANCE, order: 1 },
    { id: 'default-banded-pogo-jumps', name: 'Banded Pogo Jumps', activityType: ActivityType.RESISTANCE, order: 2 },
    { id: 'default-lateral-lunge', name: 'Lateral Lunge', activityType: ActivityType.RESISTANCE, order: 3 },
    { id: 'default-single-leg-bridge-box', name: 'Single Leg Bridge off Box', activityType: ActivityType.RESISTANCE, order: 4 },
    { id: 'default-straight-arm-situps', name: 'Straight Arm Sit ups', activityType: ActivityType.RESISTANCE, order: 5 },
    { id: 'default-farmers-walks', name: 'Farmers Walks', activityType: ActivityType.RESISTANCE, order: 6 },
  ],
};

const phase3Session3: ProgramSession = {
  id: 'default-phase3-session3',
  name: 'Session 3',
  userId: 'system',
  order: 2,
  exercises: [
    { id: 'default-squat-jumps', name: 'Squat Jumps', activityType: ActivityType.RESISTANCE, order: 0 },
    { id: 'default-db-z-press', name: 'DB Z Press', activityType: ActivityType.RESISTANCE, order: 1 },
    { id: 'default-db-sa-bent-over-row', name: 'DB SA Bent Over Row', activityType: ActivityType.RESISTANCE, order: 2 },
    { id: 'default-rdl', name: 'RDL', activityType: ActivityType.RESISTANCE, order: 3 },
    { id: 'default-pull-ups', name: 'Pull Ups', activityType: ActivityType.RESISTANCE, order: 4 },
    { id: 'default-shoulder-taps', name: 'Shoulder Taps', activityType: ActivityType.RESISTANCE, order: 5 },
    { id: 'default-plank-rotations', name: 'Plank Rotations', activityType: ActivityType.RESISTANCE, order: 6 },
  ],
};

// Complete Programs
const phase1Program: Omit<Program, 'userId'> = {
  id: 'default-program-phase1',
  name: 'Phase 1: Building the Foundations',
  description: 'Weeks 1-4: Focus on establishing proper movement patterns and building a solid foundation.\n\nAbbreviations:\nDB = Dumbbell\nSA = Single Arm\nRDL = Romanian Deadlift',
  createdBy: 'system',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  sessions: [phase1Session1, phase1Session2, phase1Session3],
  isPublic: true,
  tags: ['beginner', 'foundation', 'strength', 'built-in'],
};

const phase2Program: Omit<Program, 'userId'> = {
  id: 'default-program-phase2',
  name: 'Phase 2: Creating Strength',
  description: 'Weeks 5-8: Progress to more challenging variations and increase training intensity.\n\nAbbreviations:\nDB = Dumbbell\nRDL = Romanian Deadlift\nFFE = Foot Forward Elevated',
  createdBy: 'system',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  sessions: [phase2Session1, phase2Session2, phase2Session3],
  isPublic: true,
  tags: ['intermediate', 'strength', 'hypertrophy', 'built-in'],
};

const phase3Program: Omit<Program, 'userId'> = {
  id: 'default-program-phase3',
  name: 'Phase 3: Developing Power and Speed',
  description: 'Weeks 9-12: Introduce explosive movements and develop power output.\n\nAbbreviations:\nDB = Dumbbell\nCMJ = Counter Movement Jump\nRDL = Romanian Deadlift',
  createdBy: 'system',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  sessions: [phase3Session1, phase3Session2, phase3Session3],
  isPublic: true,
  tags: ['advanced', 'power', 'speed', 'plyometrics', 'built-in'],
};

// Full Body ABC Program Sessions
const fullBodyASession: ProgramSession = {
  id: 'default-fullbody-a',
  name: 'Full Body A',
  userId: 'system',
  order: 0,
  exercises: [
    { id: 'default-power-skips', name: 'Power Skips', activityType: ActivityType.RESISTANCE, order: 0 },
    { id: 'default-short-run-cod', name: 'Short Run with COD', activityType: ActivityType.SPEED_AGILITY, order: 1 },
    { id: 'default-short-run', name: 'Short Run', activityType: ActivityType.ENDURANCE, order: 2 },
    { id: 'default-barbell-clean', name: 'Barbell Clean', activityType: ActivityType.RESISTANCE, order: 3 },
    { id: 'default-sa-landmine-press', name: 'SA Landmine Press', activityType: ActivityType.RESISTANCE, order: 4 },
    { id: 'default-deep-squat', name: 'Deep Squat', activityType: ActivityType.RESISTANCE, order: 5 },
    { id: 'default-box-jump', name: 'Box Jump', activityType: ActivityType.RESISTANCE, order: 6 },
    { id: 'default-assisted-pogo-jumps', name: 'Assisted Pogo Jumps', activityType: ActivityType.RESISTANCE, order: 7 },
    { id: 'default-bulgarian-split-squat', name: 'Bulgarian Split Squat', activityType: ActivityType.RESISTANCE, order: 8 },
    { id: 'default-leg-curl', name: 'Leg Curl', activityType: ActivityType.RESISTANCE, order: 9 },
    { id: 'default-tibialis-curl', name: 'Tibialis Curl', activityType: ActivityType.RESISTANCE, order: 10 },
    { id: 'default-barbell-bench', name: 'Barbell Bench Press', activityType: ActivityType.RESISTANCE, order: 11 },
    { id: 'default-pull-ups', name: 'Pull Ups', activityType: ActivityType.RESISTANCE, order: 12 },
  ],
};

const fullBodyBSession: ProgramSession = {
  id: 'default-fullbody-b',
  name: 'Full Body B',
  userId: 'system',
  order: 1,
  exercises: [
    { id: 'default-skips-sideways', name: 'Skips Sideways', activityType: ActivityType.RESISTANCE, order: 0 },
    { id: 'default-sled-push', name: 'Sled Push', activityType: ActivityType.RESISTANCE, order: 1 },
    { id: 'default-short-run-b', name: 'Short Run', activityType: ActivityType.ENDURANCE, order: 2 },
    { id: 'default-trap-bar-squat', name: 'Trap Bar Squat', activityType: ActivityType.RESISTANCE, order: 3 },
    { id: 'default-trx-rows', name: 'TRX Rows', activityType: ActivityType.RESISTANCE, order: 4 },
    { id: 'default-box-squat', name: 'Box Squat', activityType: ActivityType.RESISTANCE, order: 5 },
    { id: 'default-1leg-box-jump', name: '1 Leg Box Jump', activityType: ActivityType.RESISTANCE, order: 6 },
    { id: 'default-1leg-assisted-pogo', name: '1 Leg Assisted Pogo Jumps', activityType: ActivityType.RESISTANCE, order: 7 },
    { id: 'default-hip-thrust-machine', name: 'Hip Thrust Machine', activityType: ActivityType.RESISTANCE, order: 8 },
    { id: 'default-tibialis-curl-b', name: 'Tibialis Curl', activityType: ActivityType.RESISTANCE, order: 9 },
    { id: 'default-dumbbell-incline-bench', name: 'Dumbbell Incline Bench', activityType: ActivityType.RESISTANCE, order: 10 },
    { id: 'default-barbell-rows', name: 'Barbell Rows', activityType: ActivityType.RESISTANCE, order: 11 },
    { id: 'default-barbell-shoulder-press', name: 'Barbell Shoulder Press', activityType: ActivityType.RESISTANCE, order: 12 },
    { id: 'default-pull-ups-b', name: 'Pull Ups', activityType: ActivityType.RESISTANCE, order: 13 },
  ],
};

const fullBodyCSession: ProgramSession = {
  id: 'default-fullbody-c',
  name: 'Full Body C',
  userId: 'system',
  order: 2,
  exercises: [
    { id: 'default-plyo-jumps-box-jumps', name: 'Plyo Jumps Box Jumps', activityType: ActivityType.RESISTANCE, order: 0 },
    { id: 'default-1leg-side-box-jump', name: '1 Leg Side Box Jump', activityType: ActivityType.RESISTANCE, order: 1 },
    { id: 'default-jumps-run-up', name: 'Jumps with Run Up (1 and 2 Legs)', activityType: ActivityType.RESISTANCE, order: 2 },
    { id: 'default-clean-barbell', name: 'Clean - Barbell', activityType: ActivityType.RESISTANCE, order: 3 },
    { id: 'default-landmine-rotation-press', name: 'Landmine Rotation Press', activityType: ActivityType.RESISTANCE, order: 4 },
    { id: 'default-barbell-bench-press', name: 'Barbell Bench Press', activityType: ActivityType.RESISTANCE, order: 5 },
    { id: 'default-pull-ups-c', name: 'Pull Ups', activityType: ActivityType.RESISTANCE, order: 6 },
    { id: 'default-dips', name: 'Dips', activityType: ActivityType.RESISTANCE, order: 7 },
    { id: 'default-narrow-lat-pulldown', name: 'Narrow Lat Pull-Down', activityType: ActivityType.RESISTANCE, order: 8 },
    { id: 'default-dumbbell-bulgarian-split', name: 'Dumbbell Bulgarian Split Squat', activityType: ActivityType.RESISTANCE, order: 9 },
  ],
};

const fullBodyABCProgram: Omit<Program, 'userId'> = {
  id: 'default-program-fullbody-abc',
  name: 'Full Body ABC',
  description: 'Complete full-body training program with power, strength, and conditioning.\n\nThree balanced sessions targeting all major muscle groups with explosive movements, compound lifts, and athletic performance.',
  createdBy: 'system',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  sessions: [fullBodyASession, fullBodyBSession, fullBodyCSession],
  isPublic: true,
  tags: ['full-body', 'strength', 'power', 'conditioning', 'built-in'],
};

// In-season Full Body AB & C Program Sessions
const inSeasonASession: ProgramSession = {
  id: 'default-inseason-a',
  name: 'Session A',
  userId: 'system',
  order: 0,
  notes: 'Focus on strength maintenance with adequate rest periods',
  exercises: [
    { id: 'default-power-clean-hang', name: 'Power Clean (Hang Position)', activityType: ActivityType.RESISTANCE, order: 0, notes: '4 sets x 3 reps, 2-3 min rest' },
    { id: 'default-front-squat', name: 'Front Squat', activityType: ActivityType.RESISTANCE, order: 1, notes: '4 sets x 5 reps, 2-3 min rest' },
    { id: 'default-barbell-rdl', name: 'Barbell RDL', activityType: ActivityType.RESISTANCE, order: 2, notes: '3 sets x 6 reps, 2 min rest' },
    { id: 'default-barbell-hip-thrust', name: 'Barbell Hip Thrust', activityType: ActivityType.RESISTANCE, order: 3, notes: '3 sets x 8 reps, 90 sec rest' },
    { id: 'default-bench-press-a', name: 'Bench Press', activityType: ActivityType.RESISTANCE, order: 4, notes: '3 sets x 6 reps, Minimal rest' },
    { id: 'default-pull-ups-a', name: 'Pull-Ups', activityType: ActivityType.RESISTANCE, order: 5, notes: '3 sets x 6-8 reps, 2 min rest' },
    { id: 'default-seated-shoulder-press', name: 'Seated Shoulder Press', activityType: ActivityType.RESISTANCE, order: 6, notes: '3 sets x 8 reps, Minimal rest' },
    { id: 'default-seated-cable-row', name: 'Seated Chest Supported Cable Row', activityType: ActivityType.RESISTANCE, order: 7, notes: '3 sets x 10 reps, 90 sec rest' },
    { id: 'default-calf-raises-a', name: 'Calf Raises', activityType: ActivityType.RESISTANCE, order: 8, notes: '3 sets x 12-15 reps, 60 sec rest' },
    { id: 'default-tibialis-curls-a', name: 'Tibialis Curls', activityType: ActivityType.RESISTANCE, order: 9 },
  ],
};

const inSeasonBSession: ProgramSession = {
  id: 'default-inseason-b',
  name: 'Session B',
  userId: 'system',
  order: 1,
  notes: 'Power and explosive emphasis',
  exercises: [
    { id: 'default-power-clean-blocks', name: 'Power Clean (Blocks/Hang)', activityType: ActivityType.RESISTANCE, order: 0, notes: '5 sets x 2 reps, 2-3 min rest' },
    { id: 'default-box-jumps-b', name: 'Box Jumps', activityType: ActivityType.RESISTANCE, order: 1, notes: '4 sets x 4 reps, 2-3 min rest' },
    { id: 'default-front-squat-speed', name: 'Front Squat (Speed Emphasis)', activityType: ActivityType.RESISTANCE, order: 2, notes: '4 sets x 3 reps, 2 min rest' },
    { id: 'default-barbell-hip-thrust-explosive', name: 'Barbell Hip Thrust (Explosive)', activityType: ActivityType.RESISTANCE, order: 3, notes: '3 sets x 6 reps, Minimal rest' },
    { id: 'default-med-ball-rotational-throws', name: 'Medicine Ball Rotational Throws', activityType: ActivityType.RESISTANCE, order: 4, notes: '3 sets x 6 each, 90 sec rest' },
    { id: 'default-push-press', name: 'Push Press', activityType: ActivityType.RESISTANCE, order: 5, notes: '3 sets x 5 reps, Minimal rest' },
    { id: 'default-bent-over-row', name: 'Bent Over Row', activityType: ActivityType.RESISTANCE, order: 6, notes: '3 sets x 6 reps, 2 min rest' },
    { id: 'default-bench-press-dynamic', name: 'Bench Press (Dynamic Effort)', activityType: ActivityType.RESISTANCE, order: 7, notes: '3 sets x 5 reps, 90 sec rest' },
    { id: 'default-calf-raises-explosive', name: 'Calf Raises (Explosive)', activityType: ActivityType.RESISTANCE, order: 8, notes: '3 sets x 10 reps, 60 sec rest' },
    { id: 'default-tibialis-raises', name: 'Tibialis Raises', activityType: ActivityType.RESISTANCE, order: 9, notes: '3 sets x 12 reps, 60 sec rest' },
  ],
};

const inSeasonCSession: ProgramSession = {
  id: 'default-inseason-c',
  name: 'Session C',
  userId: 'system',
  order: 2,
  notes: 'Recovery session with lighter loads and higher volume',
  exercises: [
    { id: 'default-pogo-jumps-c', name: 'Pogo Jumps', activityType: ActivityType.RESISTANCE, order: 0, notes: '3 sets x 10 reps, 90 sec rest' },
    { id: 'default-squat-jumps-light', name: 'Squat Jumps (Light/Bodyweight)', activityType: ActivityType.RESISTANCE, order: 1, notes: '3 sets x 5 reps, Full recovery' },
    { id: 'default-single-leg-rdl-light', name: 'Single Leg RDL (Light)', activityType: ActivityType.RESISTANCE, order: 2, notes: '3 sets x 8 each, 60 sec rest' },
    { id: 'default-bulgarian-split-light', name: 'Bulgarian Split Squats (Light)', activityType: ActivityType.RESISTANCE, order: 3, notes: '3 sets x 8 each, 60 sec rest' },
    { id: 'default-db-bench-press', name: 'DB Bench Press', activityType: ActivityType.RESISTANCE, order: 4, notes: '3 sets x 10 reps, Minimal rest' },
    { id: 'default-pull-ups-lat-pulldown', name: 'Pull-Ups or Lat Pulldown', activityType: ActivityType.RESISTANCE, order: 5, notes: '3 sets x 10 reps, 90 sec rest' },
    { id: 'default-seated-db-shoulder-press', name: 'Seated DB Shoulder Press', activityType: ActivityType.RESISTANCE, order: 6, notes: '3 sets x 10 reps, Minimal rest' },
    { id: 'default-seated-cable-row-c', name: 'Seated Cable Row', activityType: ActivityType.RESISTANCE, order: 7, notes: '3 sets x 12 reps, 90 sec rest' },
    { id: 'default-db-bicep-curls', name: 'DB Bicep Curls', activityType: ActivityType.RESISTANCE, order: 8, notes: '2 sets x 12 reps, Minimal rest' },
    { id: 'default-tricep-extensions', name: 'Tricep Extensions', activityType: ActivityType.RESISTANCE, order: 9, notes: '2 sets x 12 reps, 60 sec rest' },
    { id: 'default-calf-raises-c', name: 'Calf Raises', activityType: ActivityType.RESISTANCE, order: 10, notes: '2 sets x 15 reps, 60 sec rest' },
    { id: 'default-tibialis-work', name: 'Tibialis Work', activityType: ActivityType.RESISTANCE, order: 11, notes: '2 sets x 15 reps, 60 sec rest' },
  ],
};

const inSeasonProgram: Omit<Program, 'userId'> = {
  id: 'default-program-inseason-abc',
  name: 'In-season Full Body AB & C',
  description: 'Designed for in-season athletes to maintain strength and power while managing fatigue.\n\nSession A: Strength maintenance with optimal rest\nSession B: Power and explosiveness focus\nSession C: Recovery with lighter loads and higher volume\n\nAbbreviations:\nDB = Dumbbell\nRDL = Romanian Deadlift\nCOD = Change of Direction',
  createdBy: 'system',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  sessions: [inSeasonASession, inSeasonBSession, inSeasonCSession],
  isPublic: true,
  tags: ['in-season', 'full-body', 'strength-maintenance', 'power', 'recovery', 'built-in'],
};

/**
 * All default programs available in the app
 */
export const DEFAULT_PROGRAMS: Omit<Program, 'userId'>[] = [
  phase1Program,
  phase2Program,
  phase3Program,
  fullBodyABCProgram,
  inSeasonProgram,
];

/**
 * Get a default program by ID
 */
export const getDefaultProgramById = (id: string): Omit<Program, 'userId'> | undefined => {
  return DEFAULT_PROGRAMS.find(program => program.id === id);
};

/**
 * Check if a program is a built-in default program
 */
export const isDefaultProgram = (programId: string): boolean => {
  return programId.startsWith('default-program-');
};

/**
 * Get all built-in program IDs
 */
export const getDefaultProgramIds = (): string[] => {
  return DEFAULT_PROGRAMS.map(p => p.id);
};
