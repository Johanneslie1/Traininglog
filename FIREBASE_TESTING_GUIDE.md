# Firebase Permissions Testing Guide

## How to Test Different Exercise Types Logging

### 1. Login to the Application
1. Open http://localhost:3000/
2. Log in with your Firebase credentials
3. Navigate to any exercise logging screen

### 2. Open Browser Developer Console
- Press F12 or Ctrl+Shift+I (Windows/Linux)
- Go to the "Console" tab

### 3. Run the Test Function
In the browser console, type:
```javascript
testFirebasePermissions()
```

This will automatically test saving different exercise types:
- **Running** (Endurance): Duration, distance, RPE, heart rate zones
- **Football** (Team Sports): Duration, RPE, notes
- **Hiking** (Outdoor Activities): Duration, distance, difficulty, conditions
- **Yoga** (Flexibility): Duration, stretch type, intensity
- **Box Jumps** (Plyometrics): Reps, sets, box height, intensity

### 4. Check Results
The console will show:
- ✅ Success messages for each exercise type that saves correctly
- ❌ Error messages for any permission issues
- 🚫 Specific permission denied errors if Firestore rules need updating

### 5. Verify in Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project: "session-logger-3619e"
3. Go to Firestore Database
4. Check that test exercises are saved under:
   - `users/{userId}/exercises/` (new structure)
   - Look for exercises with different types: endurance, team_sports, outdoor, flexibility, plyometrics

## Firestore Rules Status

Current rules in `firestore.rules` support:
- ✅ User authentication required
- ✅ User can only access their own data
- ✅ CRUD operations on exercises under `users/{userId}/exercises/`
- ✅ CRUD operations on exercise logs under `users/{userId}/exerciseLogs/`
- ✅ Legacy support for top-level exerciseLogs collection

## Troubleshooting

### Permission Denied Errors
If you see "permission-denied" errors:
1. Check that you're logged in
2. Verify the Firestore rules are deployed to Firebase Console
3. Ensure the userId matches the authenticated user

### Undefined Value Errors  
If you see "undefined" validation errors:
1. Check that the `cleanObject` utility is working
2. Verify the exercise type mapping is correct
3. Check the ExerciseSet structure in console

### Testing Individual Exercise Types
You can also test individual exercise types through the UI:
1. Go to "Log Exercise" → "Log Directly"
2. Select different exercise types from different categories
3. Fill out the type-specific fields
4. Save and check browser console for any errors

## Current Firebase Configuration
- Project ID: session-logger-3619e
- Auth Domain: session-logger-3619e.firebaseapp.com
- Storage: session-logger-3619e.firebasestorage.app
