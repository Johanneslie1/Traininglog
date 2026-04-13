# Team Creation Debug Guide

## Current Issue
Getting "Missing or insufficient permissions" error when creating a team.

## Debug Steps to Follow

### 1. Check Console Logs

Open the browser console (F12) when attempting to create a team. You should see detailed logs:

```
[teamService] Starting team creation...
[teamService] Auth state: { uid: '...', email: '...', isAuthenticated: true }
[teamService] Attempting to fetch user document...
[teamService] User document exists: true/false
[teamService] Using coach name: ...
[teamService] Generated team document reference: ...
[teamService] Team data to write: { ... }
[teamService] Attempting to write team document...
```

**What to check:**
- Is `uid` present and matches your Firebase user ID?
- Is `isAuthenticated: true`?
- Does the team data look correct?
- At which step does it fail?

### 2. Verify Firebase Authentication

In browser console, run:
```javascript
firebase.auth().currentUser
```

This should return an object with your user details. If null, you're not logged in.

### 3. Check Firestore Rules in Firebase Console

1. Go to: https://console.firebase.google.com/project/session-logger-3619e/firestore/rules
2. Verify the rules include:

```plaintext
match /teams/{teamId} {
  allow create: if isAuthenticated() && 
    request.resource.data.coachId == request.auth.uid;
}
```

3. Click "Publish" if rules aren't published

### 4. Test Firestore Rules Simulator

1. In Firebase Console → Firestore → Rules
2. Click "Rules Playground"
3. Select operation: `create`
4. Location: `/teams/test-team-id`
5. Check "Authenticated" and enter your UID
6. Test data:
```json
{
  "coachId": "YOUR_UID_HERE",
  "name": "Test Team",
  "description": "Test",
  "coachName": "Test Coach",
  "inviteCode": "ABC123",
  "createdAt": "2026-02-14T10:00:00.000Z",
  "updatedAt": "2026-02-14T10:00:00.000Z",
  "isActive": true
}
```
7. Click "Test" - should show "Allowed"

### 5. Check User Role

In browser console:
```javascript
// Check Redux state
window.reduxStore.getState().auth.user
```

Look for the `role` field. It should be 'coach' or 'both'.

### 6. Verify User Document Exists

The error might be from trying to read the user document. Test manually in console:

```javascript
import { getFirestore, doc, getDoc } from 'firebase/firestore';
const db = getFirestore();
const userDoc = await getDoc(doc(db, 'users', 'YOUR_UID'));
console.log('User exists:', userDoc.exists());
console.log('User data:', userDoc.data());
```

If this fails with permissions error, the `users` collection rules might need adjustment.

### 7. Check for Cached Rules

Sometimes browsers cache Firestore rules. Try:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Try in incognito/private window

### 8. Verify Project ID Match

In `.env` file, verify:
```
VITE_FIREBASE_PROJECT_ID=session-logger-3619e
```

Must match the Firebase project in console.

## Common Causes & Solutions

### Cause 1: User Document Permission Error

**Symptom:** Error occurs when trying to fetch user document for coach name

**Solution:** User document read failing is now handled gracefully. But verify the `users/{userId}` rules allow read:

```plaintext
match /users/{userId} {
  allow read: if isAuthenticated() && isOwner(userId);
}
```

### Cause 2: Field Mismatch

**Symptom:** Rules expect certain fields that aren't present

**Solution:** Verify the team data includes all required fields:
- `coachId` (must equal logged-in user's UID)
- `name`
- `inviteCode`
- `isActive`
- `createdAt`
- `updatedAt`

### Cause 3: Auth State Not Ready

**Symptom:** Intermittent failures, works sometimes

**Solution:** The `ensureAuth()` function already waits for auth. But double-check by adding a delay:

```typescript
await new Promise(resolve => setTimeout(resolve, 500));
```

### Cause 4: Wrong Firestore Instance

**Symptom:** Rules are correct but still failing

**Solution:** Ensure using the correct Firestore instance. Check:
```typescript
import { db } from '@/services/firebase/firebase';
```

Not creating a new instance.

### Cause 5: Indexes Not Built

**Symptom:** Works for some queries, fails for others

**Solution:** Check Firestore → Indexes tab. May need composite indexes for team queries.

## Manual Test in Firebase Console

1. Go to Firestore Database in console
2. Click "Start Collection"
3. Collection ID: `teams`
4. Document ID: Auto-generate
5. Add fields:
   - `coachId`: string → YOUR_UID
   - `name`: string → "Test Team"
   - `isActive`: boolean → true
   - `inviteCode`: string → "TEST123"
   - `createdAt`: string → "2026-02-14T10:00:00Z"
   - `updatedAt`: string → "2026-02-14T10:00:00Z"
   - `coachName`: string → "Test"
   - `description`: string → "Test"
6. Click Save

If this fails with permissions error, the rules definitely have an issue.

## Next Steps Based on Logs

### If logs show authentication issue:
- Check Redux auth state
- Verify user is logged in
- Check token hasn't expired

### If logs show data validation issue:
- Check all required fields are present
- Verify data types match rules
- Ensure no undefined fields after removeUndefinedFields()

### If logs show Firestore connection issue:
- Check network tab for failed requests
- Verify Firebase project ID is correct
- Check if offline mode is preventing writes

### If setDoc() call fails:
- This is the actual permission error
- Check Firestore rules exactly match expected format
- Verify rules are published (not just saved)
- Try rules simulator with exact data structure

## Getting More Details

Add this to CreateTeamModal to see the complete error:

```typescript
} catch (error) {
  console.error('Full error object:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  toast.error(error instanceof Error ? error.message : 'Failed to create team');
}
```

## Contact Support

If none of these steps resolve the issue, provide:
1. Complete console log output from team creation attempt
2. Screenshot of Firestore rules from console
3. Your Firebase user UID
4. Browser and version
5. Whether issue occurs in all browsers or just one

The detailed logs added to `teamService.ts` will help pinpoint exactly where the failure occurs.
