/**
 * Program Exercise Reference Testing Utilities
 * 
 * Use these functions in the browser console to test exercise reference functionality
 */

import { Program } from '@/types/program';

// Test 1: Validate Exercise References in a Program
export async function testProgramExerciseReferences(programId: string) {
  console.log('🧪 Testing program exercise references...');
  
  try {
    const { getPrograms } = await import('@/services/programService');
    const programs = await getPrograms();
    const program = programs.find((p: Program) => p.id === programId);
    
    if (!program) {
      console.error('❌ Program not found:', programId);
      return;
    }
    
    console.log('✅ Program found:', program.name);
    console.log('📊 Sessions:', program.sessions.length);
    
    for (const session of program.sessions) {
      console.log(`\n📋 Session: ${session.name}`);
      console.log(`   Exercises: ${session.exercises.length}`);
      
      for (const exercise of session.exercises) {
        console.log(`\n   🏋️ Exercise:`, {
          id: exercise.id,
          name: exercise.name,
          exerciseRef: exercise.exerciseRef,
          activityType: exercise.activityType,
          hasReference: !!exercise.exerciseRef || exercise.id.startsWith('default-') || exercise.id.startsWith('imported-'),
        });
        
        // Test resolution
        const { resolveExerciseReference } = await import('@/services/exerciseReferenceService');
        const resolved = await resolveExerciseReference(exercise);
        
        if (resolved) {
          console.log(`   ✅ Resolved successfully`);
          console.log(`      Type: ${resolved.type}, Category: ${resolved.category}`);
        } else {
          console.warn(`   ⚠️ Could not resolve exercise reference`);
        }
      }
    }
    
    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test 2: Validate All Programs
export async function testAllProgramExercises() {
  console.log('🧪 Testing all programs for exercise reference integrity...');
  
  try {
    const { getPrograms } = await import('@/services/programService');
    const { resolveExerciseReference } = await import('@/services/exerciseReferenceService');
    const programs = await getPrograms();
    
    let totalPrograms = programs.length;
    let totalSessions = 0;
    let totalExercises = 0;
    let validReferences = 0;
    let invalidReferences = 0;
    
    for (const program of programs) {
      totalSessions += program.sessions.length;
      
      for (const session of program.sessions) {
        for (const exercise of session.exercises) {
          totalExercises++;
          
          const resolved = await resolveExerciseReference(exercise);
          if (resolved) {
            validReferences++;
          } else {
            invalidReferences++;
            console.warn(`⚠️ Invalid reference in "${program.name}" > "${session.name}":`, {
              id: exercise.id,
              name: exercise.name,
              exerciseRef: exercise.exerciseRef
            });
          }
        }
      }
    }
    
    console.log('\n📊 Test Results:');
    console.log(`Programs: ${totalPrograms}`);
    console.log(`Sessions: ${totalSessions}`);
    console.log(`Total Exercises: ${totalExercises}`);
    console.log(`✅ Valid References: ${validReferences}`);
    console.log(`❌ Invalid References: ${invalidReferences}`);
    
    const successRate = totalExercises > 0 ? (validReferences / totalExercises * 100).toFixed(1) : 0;
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (invalidReferences === 0) {
      console.log('\n🎉 All exercise references are valid!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test 3: Create Test Program
export async function createTestProgram() {
  console.log('🧪 Creating test program with exercise references...');
  
  try {
    const { createProgram } = await import('@/services/programService');
    const { auth } = await import('@/services/firebase/config');
    const { ActivityType } = await import('@/types/activityTypes');
    const user = auth.currentUser;
    
    if (!user) {
      console.error('❌ User not logged in');
      return;
    }
    
    const testProgram = {
      name: `Test Program ${new Date().toISOString().slice(0, 10)}`,
      description: 'Automated test program for exercise references',
      createdBy: user.uid,
      userId: user.uid,
      sessions: [
        {
          id: `temp-${Date.now()}`,
          name: 'Test Session - Upper Body',
          userId: user.uid,
          exercises: [
            {
              id: 'default-bench-press',
              name: 'Bench Press',
              activityType: ActivityType.RESISTANCE,
              order: 0,
              notes: 'Test exercise from default database'
            },
            {
              id: 'default-barbell-row',
              name: 'Barbell Row',
              activityType: ActivityType.RESISTANCE,
              order: 1,
              notes: 'Another test exercise'
            }
          ]
        },
        {
          id: `temp-${Date.now() + 1}`,
          name: 'Test Session - Lower Body',
          userId: user.uid,
          exercises: [
            {
              id: 'default-squat',
              name: 'Squat',
              activityType: ActivityType.RESISTANCE,
              order: 0,
              notes: 'Leg exercise'
            }
          ]
        }
      ],
      isPublic: false,
      tags: ['test']
    };
    
    await createProgram(testProgram);
    console.log('✅ Test program created successfully!');
    console.log('🔍 Check Firestore to verify exercise references are saved correctly');
  } catch (error) {
    console.error('❌ Failed to create test program:', error);
  }
}

// Test 4: Verify Exercise Database
export async function testExerciseDatabase() {
  console.log('🧪 Testing exercise database access...');
  
  try {
    const { allExercises } = await import('@/data/exercises');
    const { importedExercises } = await import('@/data/importedExercises');
    
    console.log(`📊 Default exercises: ${allExercises.length}`);
    console.log(`📊 Imported exercises: ${importedExercises.length}`);
    
    // Test a few exercise IDs
    const testIds = [
      'default-bench-press',
      'default-squat',
      'default-deadlift'
    ];
    
    console.log('\n🔍 Testing exercise ID resolution:');
    for (const id of testIds) {
      const exerciseName = id.replace('default-', '').replace(/-/g, ' ');
      const found = allExercises.find(
        (ex: any) => ex.name.toLowerCase().replace(/\s+/g, '-') === exerciseName
      );
      
      if (found) {
        console.log(`✅ ${id} → "${found.name}"`);
      } else {
        console.warn(`⚠️ ${id} not found in database`);
      }
    }
    
    console.log('\n✅ Exercise database test complete!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Instructions for using these tests in browser console
console.log(`
🧪 Program Exercise Reference Testing Utilities

To test exercise references, copy and paste these commands in the browser console:

1. Test a specific program:
   testProgramExerciseReferences('your-program-id')

2. Test all programs:
   testAllProgramExercises()

3. Create a test program:
   createTestProgram()

4. Test exercise database:
   testExerciseDatabase()

Note: These functions are async, so results will appear after a moment.
`);

// Export for use in console
if (typeof window !== 'undefined') {
  (window as any).testProgramExerciseReferences = testProgramExerciseReferences;
  (window as any).testAllProgramExercises = testAllProgramExercises;
  (window as any).createTestProgram = createTestProgram;
  (window as any).testExerciseDatabase = testExerciseDatabase;
}
