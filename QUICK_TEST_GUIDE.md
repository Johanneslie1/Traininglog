# 🎯 Quick Test Guide - State Persistence & Back Button

## ⚡ 30-Second Test

### Test Persistence:
1. Start creating program → Add sessions/exercises
2. Refresh page (F5)
3. ✅ Should restore everything

### Test Back Button:
1. Navigate deep into app
2. Press phone's back button
3. ✅ Should go back one step (NOT exit)

---

## 📱 What You Should See

### Creating Program Flow:
```
Create Program
  ↓ (add session)
Session Builder
  ↓ (add exercises)
Exercise Selection
  ↓ (back button)
Session Builder ← YOU ARE HERE
  ↓ (back button)
Program Builder
  ↓ (back button)
Programs List
  ↓ (back button)
Home
  ↓ (back button)
"Exit app?" confirmation
```

### Auto-Save Indicators:
- 💾 Every field change saves automatically
- 🔄 Refresh preserves your work
- ✨ No manual "Save Draft" needed

---

## 🐛 If Something's Wrong

### State Not Persisting?
→ Open Chrome DevTools
→ Application → Local Storage
→ Should see `form_data_*` keys

### Back Button Exits Immediately?
→ Check you're not on home page
→ Look for console logs: `[useAndroidBackButton]`
→ Try navigating to Programs first

### Data Disappears?
→ Check if >1 hour passed (auto-cleanup)
→ Verify not in incognito mode
→ Check browser console for errors

---

## ✅ Success Checklist

- [ ] Create program with multiple sessions
- [ ] Add exercises to each session
- [ ] Refresh page - data still there
- [ ] Use back button - navigates naturally
- [ ] Only exit confirmation on home page
- [ ] Saved programs clear the draft data

---

## 📊 What's Persisted

### Program Builder
- [x] Program name
- [x] Program description
- [x] All sessions
- [x] All exercises in each session

### Session Builder
- [x] Session name
- [x] Session notes
- [x] All exercises with details
- [x] Exercise order

### Navigation
- [x] Current page
- [x] Scroll position
- [x] Last visited route

---

## ⏱️ Timing

| Data Type | Persistence Time |
|-----------|------------------|
| Form data | 1 hour |
| Navigation | 24 hours |
| Auto-save | Real-time |
| Cleanup | Automatic |

---

## 🔧 Quick Fixes

**Problem**: Form seems empty after refresh
**Fix**: Check it's been <1 hour, or data was saved successfully

**Problem**: Back button does nothing
**Fix**: Make sure you're using HashRouter URLs (#/programs)

**Problem**: Too many confirmations
**Fix**: Only happens on root page - this is intentional

---

## 📞 Support Info

Files changed:
- `src/utils/statePersistence.ts` - Core persistence
- `src/hooks/useBackButton.ts` - Back button logic
- `src/hooks/usePersistedState.ts` - Form state hook
- `src/features/programs/ProgramBuilder.tsx` - Added persistence
- `src/features/programs/SessionBuilder.tsx` - Added persistence
- `src/features/programs/CreateNewProgram.tsx` - Added persistence
- `src/providers.tsx` - Navigation handler
- `src/App.tsx` - Initialization

Console logs to look for:
- `[StatePersistence]` - Storage operations
- `[useAndroidBackButton]` - Back button events
- `[SessionBuilder]` - Session operations
- `[ProgramBuilder]` - Program operations

---

**Last Updated**: October 13, 2025
**Status**: ✅ Complete & Ready
**Test Priority**: Samsung Phone Back Button
