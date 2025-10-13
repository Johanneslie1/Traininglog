# React Hooks Violation Fix - SessionBuilder

## Error
```
Warning: React has detected a change in the order of Hooks called by SessionBuilder.
Error: Rendered more hooks than during the previous render.
```

## Root Cause
Hooks (`useState` and `useEffect`) were being called conditionally inside the `if (view === 'copyPrevious')` block, which violates React's Rules of Hooks. Hooks must:
1. Always be called in the same order
2. Never be called conditionally
3. Always be at the top level of the component

## The Problem Code
```typescript
if (view === 'copyPrevious') {
  // ❌ WRONG: Hooks inside conditional
  const [userId, setUserId] = React.useState('');
  
  React.useEffect(() => {
    getUserId().then(setUserId);
  }, []);
  
  return <CopyFromPreviousSessionDialog userId={userId} />
}
```

## The Fix
Moved hooks to the top level of the component:

```typescript
const SessionBuilder: React.FC<SessionBuilderProps> = ({...}) => {
  // ✅ CORRECT: All hooks at top level
  const [userId, setUserId] = useState('');
  
  useEffect(() => {
    const getUserId = async () => {
      const { auth } = await import('@/services/firebase/config');
      return auth.currentUser?.uid || '';
    };
    getUserId().then(setUserId);
  }, []);
  
  // ... other hooks ...
  
  // Later in conditional render:
  if (view === 'copyPrevious') {
    return <CopyFromPreviousSessionDialog userId={userId} />
  }
}
```

## Why This Matters
React relies on the order of hooks to maintain state between renders. When hooks are called conditionally:
- The order changes between renders
- React can't match up the state correctly
- The component crashes with "Rendered more hooks than during the previous render"

## File Changed
- `src/features/programs/SessionBuilder.tsx`

## Testing
1. Open a program
2. Click to add/edit a session
3. Click "Add Exercise"
4. Click "Copy from Previous"
5. **Expected**: No React errors in console
6. **Expected**: Dialog opens correctly with userId populated

## Status
✅ Fixed - Hooks now comply with Rules of Hooks

---

**Date**: October 13, 2025
**Reference**: https://reactjs.org/link/rules-of-hooks
