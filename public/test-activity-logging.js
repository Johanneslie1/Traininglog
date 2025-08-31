// Debug test for the Universal Activity Logger
console.log('🧪 Testing Universal Activity Logger functionality');

async function testActivityLogging() {
    console.log('🏃 Starting activity logging test...');
    
    try {
        // First, let's check if we can import the necessary modules
        const { addActivityLog } = await import('/src/services/firebase/activityLogs.ts');
        const { ActivityType } = await import('/src/types/activityTypes.ts');
        
        console.log('✅ Successfully imported Firebase activity logging');
        
        // Check authentication
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const user = auth.currentUser;
        
        console.log('🔐 Current user:', user ? {
            uid: user.uid,
            email: user.email,
            isAnonymous: user.isAnonymous
        } : 'No user authenticated');
        
        if (!user) {
            console.log('❌ No authenticated user - trying to continue with localStorage fallback');
            return testLocalStorageLogging();
        }
        
        // Test activity log data structure that Universal Logger creates
        const testActivityData = {
            activityName: 'Test Running Session',
            userId: user.uid,
            activityType: ActivityType.ENDURANCE,
            sets: [{
                setNumber: 1,
                weight: 0,
                reps: 1,
                difficulty: 'normal',
                duration: 30, // 30 minutes
                distance: 5.2, // 5.2 km
                pace: '5:45/km',
                averageHeartRate: 155,
                maxHeartRate: 172,
                calories: 350,
                elevation: 80,
                rpe: 7,
                hrZone1: 5,
                hrZone2: 20,
                hrZone3: 5,
                notes: 'Good test run'
            }]
        };
        
        console.log('💾 Test activity data:', testActivityData);
        
        const docId = await addActivityLog(testActivityData, new Date());
        console.log('✅ Successfully saved activity with ID:', docId);
        
        // Now test retrieval
        const { getActivityLogs } = await import('/src/services/firebase/activityLogs.ts');
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        const activities = await getActivityLogs(user.uid, startOfDay, endOfDay);
        console.log('📖 Retrieved activities:', activities.length);
        
        const testActivity = activities.find(a => a.activityName === 'Test Running Session');
        if (testActivity) {
            console.log('✅ Test activity found in Firebase:', testActivity);
        } else {
            console.log('❌ Test activity not found in Firebase results');
        }
        
    } catch (error) {
        console.error('❌ Error testing Firebase activity logging:', error);
        console.log('🔄 Falling back to localStorage test...');
        return testLocalStorageLogging();
    }
}

function testLocalStorageLogging() {
    console.log('📦 Testing localStorage activity logging...');
    
    // Test the localStorage-based activity service
    const testActivity = {
        id: 'test-localStorage-' + Date.now(),
        activityType: 'endurance',
        activityName: 'Test localStorage Run',
        userId: 'test-user-123',
        timestamp: new Date().toISOString(),
        sessions: [{
            sessionNumber: 1,
            duration: 25,
            distance: 4.5,
            pace: '6:00/km',
            averageHeartRate: 150,
            maxHeartRate: 168,
            calories: 320,
            elevation: 60,
            rpe: 6,
            hrZone1: 3,
            hrZone2: 18,
            hrZone3: 4,
            notes: 'Easy localStorage test run'
        }]
    };
    
    // Save to localStorage
    const logs = JSON.parse(localStorage.getItem('activity-logs') || '[]');
    logs.push(testActivity);
    localStorage.setItem('activity-logs', JSON.stringify(logs));
    
    console.log('✅ Saved test activity to localStorage:', testActivity.activityName);
    
    // Test retrieval through unified utils
    return testUnifiedRetrieval();
}

async function testUnifiedRetrieval() {
    console.log('🔧 Testing unified exercise retrieval...');
    
    try {
        const { getAllExercisesByDate } = await import('/src/utils/unifiedExerciseUtils.ts');
        
        const today = new Date();
        const userId = 'test-user-123';
        
        const exercises = await getAllExercisesByDate(today, userId);
        console.log(`📊 Unified retrieval found ${exercises.length} exercises for today`);
        
        exercises.forEach((ex, i) => {
            console.log(`${i + 1}. ${ex.exerciseName} (${ex.activityType}) - Sets: ${ex.sets?.length || 0}`);
            if (ex.sets?.[0]) {
                console.log('   First set data:', ex.sets[0]);
            }
        });
        
        // Test the conversion logic specifically
        console.log('🔄 Testing activity log conversion...');
        const activityLogs = JSON.parse(localStorage.getItem('activity-logs') || '[]');
        console.log(`Found ${activityLogs.length} activity logs in localStorage`);
        
        activityLogs.forEach((log, i) => {
            console.log(`Activity ${i + 1}:`, {
                name: log.activityName,
                type: log.activityType,
                sessions: log.sessions?.length || 0,
                timestamp: log.timestamp
            });
        });
        
    } catch (error) {
        console.error('❌ Error testing unified retrieval:', error);
    }
}

// Test display logic
function testDisplayLogic() {
    console.log('🎨 Testing exercise display logic...');
    
    const testExercises = [
        {
            id: 'test-endurance',
            exerciseName: 'Morning Run',
            activityType: 'endurance',
            sets: [{
                setNumber: 1,
                duration: 30,
                distance: 5.2,
                pace: '5:45/km',
                averageHeartRate: 155,
                calories: 350
            }]
        },
        {
            id: 'test-resistance',
            exerciseName: 'Bench Press',
            activityType: 'resistance',
            sets: [{
                setNumber: 1,
                weight: 80,
                reps: 10,
                rpe: 7
            }]
        }
    ];
    
    testExercises.forEach(exercise => {
        const isNonResistance = (exercise.activityType && 
            !['resistance', 'strength'].includes(exercise.activityType)) ||
            (exercise.sets?.[0] && (
                ((!exercise.sets[0].weight || exercise.sets[0].weight === 0) && 
                 (!exercise.sets[0].reps || exercise.sets[0].reps <= 1)) &&
                (exercise.sets[0].duration || exercise.sets[0].distance || exercise.sets[0].calories ||
                 exercise.sets[0].averageHeartRate || exercise.sets[0].holdTime || exercise.sets[0].pace)
            ));
        
        console.log(`📋 ${exercise.exerciseName}:`, {
            activityType: exercise.activityType,
            isNonResistance,
            expectedDisplay: isNonResistance ? 'Activity format' : 'Weight/reps format'
        });
    });
}

// Run all tests
testActivityLogging().then(() => {
    console.log('✅ Activity logging tests completed');
    testDisplayLogic();
}).catch(error => {
    console.error('❌ Test failed:', error);
    testLocalStorageLogging();
    testDisplayLogic();
});
