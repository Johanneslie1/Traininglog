# Activity Data Conversion Fix - Testing Guide

## Current Status ✅
- **Exercise Loading Fix**: WORKING ✅ (You can see "Jogging" exercise in the UI)
- **Activity Data Display**: NEEDS TESTING 🧪

## Problem Being Fixed
The "Jogging" exercise is showing but only displays generic resistance training fields (0kg, 1r, Total Volume 0kg, RPE 6/10) instead of activity-specific data like:
- Distance (e.g., 5.2 km)
- Duration (e.g., 30:45)
- Calories (e.g., 340 cal)
- Pace (e.g., 5:55/km)
- Heart Rate zones
- Average/Max HR

## What We Fixed
Added proper conversion logic to transform Firestore exercise data back to activity-specific display format.

## Testing Steps

### 1. Test Current Data Conversion
Open browser console at http://localhost:3000 and run:
```javascript
testActivityDataConversion()
```

This will:
- Load exercises for today's date
- Show detailed breakdown of activity exercise data
- Tell you if activity-specific fields are being converted properly

### 2. Check Raw Firestore Data
```javascript
checkFirestoreExercises()
```

This will show what's actually stored in Firestore for your exercises.

### 3. Test Current Loading
```javascript
testCurrentLoading()
```

This gives a quick overview of what's being loaded and displayed.

### 4. Refresh Exercise Type Debugger
Click the "Debug" button (yellow warning icon) next to the calendar to open the Exercise Type Debugger. It should now show:
- Non-zero counts for exercise types
- Actual exercise data in the panels

## Expected Results After Fix

### Before Fix:
```
Jogging
0kg 1r
Total Volume: 0kg
RPE: 6/10
```

### After Fix:
```
Jogging  
5.2km 30:45
Distance: 5.2km
Duration: 30:45
Calories: 340
Pace: 5:55/km
Avg HR: 145 bpm
```

## If Tests Show Success
If `testActivityDataConversion()` shows activity-specific data is being converted properly, but the UI still shows generic resistance training fields, then the issue is in the **display components** - they need to be updated to show activity-specific fields instead of weight/reps.

## If Tests Show Failure
If the test shows no activity-specific data, we need to debug:
1. How the data is stored in Firestore
2. How the conversion logic is working
3. The mapping between Firestore format and ActivityLog format

## Next Steps
1. Run the tests above
2. Report what you see in the console output
3. Check if the Exercise Type Debugger now shows data
4. We'll proceed based on what the tests reveal
