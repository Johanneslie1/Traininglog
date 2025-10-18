# Testing Guide: Built-in Training Programs

## Quick Test Steps

### 1. View Built-in Programs
1. Navigate to the Programs page in your app
2. You should see 4 new programs with blue/purple "Built-in" badges:
   - **Phase 1: Building the Foundations**
   - **Phase 2: Creating Strength**
   - **Phase 3: Developing Power and Speed**
   - **Full Body ABC**

### 2. Test Program List Features
- ✅ Built-in programs display the star badge
- ✅ Hovering over built-in programs does NOT show delete button
- ✅ User-created programs still show delete button on hover
- ✅ All programs are clickable to view details

### 3. Test Program Detail View
**For Built-in Programs:**
1. Click on any Phase program
2. Verify:
   - ✅ "Built-in" badge appears next to program name in header
   - ✅ Edit/Delete buttons are HIDDEN in header
   - ✅ Sessions are visible and expandable
   - ✅ Edit/Delete buttons are HIDDEN for each session
   - ✅ "Add New Session" button is HIDDEN
   - ✅ Blue info banner appears explaining the program is read-only
   - ✅ All exercises in sessions are visible

**For User Programs:**
1. Create or select a user program
2. Verify:
   - ✅ No "Built-in" badge
   - ✅ Edit/Delete buttons are VISIBLE in header
   - ✅ Can edit program name and description
   - ✅ Can add, edit, and delete sessions
   - ✅ "Add New Session" button is VISIBLE

### 4. Test Session Content

**Phase 1, Session 1 should contain:**
1. Goblet Squat
2. DB Floor Press
3. SA DB Bent Over Row
4. RDL
5. Single Leg Bridge
6. Shoulder Taps
7. Deadbug

**Phase 2, Session 1 should contain:**
1. Back Squat
2. RDL
3. Banded Deadbugs
4. Strict Press
5. Bent Over Row
6. Hollow Holds
7. Side Plank

**Phase 3, Session 1 should contain:**
1. Back Squat
2. CMJ (Counter Movement Jump)
3. DB Split Jerk
4. Band Pullaparts
5. Reverse Lunge
6. Deadbugs
7. Side Plank

**Full Body A should contain:**
1. Power Skips
2. Short Run with COD
3. Short Run
4. Barbell Clean
5. SA Landmine Press
6. Deep Squat
7. Box Jump
8. Assisted Pogo Jumps
9. Bulgarian Split Squat
10. Leg Curl
11. Tibialis Curl
12. Barbell Bench Press
13. Pull Ups

**Full Body B should contain:**
1. Skips Sideways
2. Sled Push
3. Short Run
4. Trap Bar Squat
5. TRX Rows
6. Box Squat
7. 1 Leg Box Jump
8. 1 Leg Assisted Pogo Jumps
9. Hip Thrust Machine
10. Tibialis Curl
11. Dumbbell Incline Bench
12. Barbell Rows
13. Barbell Shoulder Press
14. Pull Ups

**Full Body C should contain:**
1. Plyo Jumps Box Jumps
2. 1 Leg Side Box Jump
3. Jumps with Run Up (1 and 2 Legs)
4. Clean - Barbell
5. Landmine Rotation Press
6. Barbell Bench Press
7. Pull Ups
8. Dips
9. Narrow Lat Pull-Down
10. Dumbbell Bulgarian Split Squat

### 5. Test Delete Protection
Try to delete a built-in program from:
- ✅ Program list (button should be hidden)
- ✅ Program detail (button should be hidden)
- ✅ Attempting programmatic deletion should show error

### 6. Test Error Handling
1. Without authentication, verify built-in programs still appear
2. With authentication, verify built-in programs merge with user programs
3. If Firestore connection fails, built-in programs should still be visible

## Expected Behavior Summary

### ✅ Built-in Programs Are:
- Always visible to all users
- Clearly marked with badges and visual indicators
- Fully readable and viewable
- Protected from editing and deletion
- Available even without login

### ❌ Built-in Programs Cannot:
- Be edited (name, description)
- Have sessions added
- Have sessions modified
- Have sessions deleted
- Be deleted from the system

### 🎯 User Programs Can:
- Be created, edited, and deleted
- Have full session management
- Be distinguished from built-in programs

## Visual Verification Checklist

### Program List Card
- [ ] Built-in badge visible (blue/purple gradient with star)
- [ ] No delete button on hover for built-in programs
- [ ] Program name displays correctly
- [ ] Session count shows (3 sessions)
- [ ] Description shows abbreviations guide

### Program Detail Page
- [ ] Built-in badge in header next to program name
- [ ] No edit/delete buttons in header for built-in
- [ ] Info banner explaining read-only status
- [ ] All 3 sessions visible
- [ ] Each session shows correct exercise count
- [ ] Exercises expandable and viewable
- [ ] No edit/delete buttons on sessions
- [ ] No "Add New Session" button

## Browser Console Verification
Open browser console and verify:
```
[ProgramsContext] Total programs (default + user): X
```
Where X = 4 (built-in) + number of user programs

## Troubleshooting

### Programs not showing?
- Check browser console for errors
- Verify `src/config/defaultPrograms.ts` exists
- Check `ProgramsContext.tsx` imports

### Can still edit built-in programs?
- Check `isDefaultProgram()` function is working
- Verify program IDs start with 'default-program-'
- Check `ProgramDetail.tsx` has proper checks

### Badge not appearing?
- Verify `isDefaultProgram()` import in components
- Check CSS classes are applied
- Verify `isBuiltIn` variable is being used

## Success Criteria
✅ All 4 programs visible and accessible (3 Phase programs + Full Body ABC)
✅ Built-in programs clearly distinguished with badges
✅ No editing/deletion possible on built-in programs
✅ All exercises and sessions display correctly
✅ User can still create and manage their own programs
✅ Works with and without user authentication
✅ Full Body ABC shows multi-modal training (resistance, speed/agility, endurance)
