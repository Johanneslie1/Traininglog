# TrainingLog App - Implementation Roadmap

## Vision
Build the best training tracking/logging app for coaches - focusing on simplicity, seamless activity logging, activity-specific metrics, and team management capabilities.

## Current State Analysis

### ✅ What Exists
- **6 Activity Types**: Resistance, Sport, Stretching, Endurance, Speed/Agility, Other
- **Exercise Database**: JSON files per activity type + resistance exercises in TypeScript
- **Program System**: Programs → Sessions → Exercises hierarchy
- **Basic Export**: CSV export for sessions, exercise logs, and sets (in Settings)
- **Firebase Backend**: Auth, Firestore with user-owned data
- **PWA**: Mobile-ready with service worker

### ❌ What's Missing
- **Coaching Features**: No team management, athlete sharing, or coach dashboard
- **Activity-Specific Export**: Export doesn't differentiate metrics by activity type
- **UI Polish**: Inconsistent editing flows, complex navigation
- **Analytics Dashboard**: No visual progress tracking
- **Program Sharing**: Programs are user-private only

---

## Phase 1: UI/UX Foundation (Week 1-2)
*Goal: Make the core logging experience seamless and intuitive*

### 1.1 Streamlined Exercise Logging
- [ ] One-tap add set with smart defaults
- [ ] Inline editing for all set fields
- [ ] Quick-copy previous set values
- [ ] Swipe gestures for delete/edit on mobile

### 1.2 Improved Navigation
- [ ] Bottom navigation bar for main sections
- [ ] Breadcrumb navigation in nested views
- [ ] Quick-access floating action button (FAB)
- [ ] Consistent back button behavior

### 1.3 Exercise/Set Management
- [ ] Drag-to-reorder exercises in a workout
- [ ] Bulk edit mode for sets
- [ ] Quick templates for common set patterns (5x5, 3x10, etc.)
- [ ] Rest timer with auto-start option

---

## Phase 2: Activity-Specific Metrics (Week 2-3)
*Goal: Each activity type tracks and displays its unique metrics*

### 2.1 Activity-Aware Set Logger
- [ ] Dynamic form fields based on activity type
- [ ] Resistance: weight, reps, RPE, rest time
- [ ] Endurance: duration, distance, pace, heart rate, calories
- [ ] Speed/Agility: duration, reps, drill-specific metrics
- [ ] Stretching: hold time, intensity, body region
- [ ] Sport: duration, intensity, performance notes, score

### 2.2 Activity-Specific Display Cards
- [ ] Unique card layouts per activity type
- [ ] Highlight primary metrics prominently
- [ ] Color-coded activity type badges
- [ ] Summary stats tailored to activity

### 2.3 Smart Defaults & Suggestions
- [ ] Remember last-used values per exercise
- [ ] Suggest progression based on history
- [ ] Auto-calculate pace from distance/duration
- [ ] Heart rate zone visualization

---

## Phase 3: Enhanced Export System (Week 3-4)
*Goal: Export data with activity-specific metrics in useful formats*

### 3.1 Export Options
- [ ] Export by date range selection
- [ ] Export by activity type filter
- [ ] Export by program/session filter
- [ ] Choose export format: CSV, JSON, PDF

### 3.2 Activity-Specific Export Schemas
- [ ] Resistance: exercise, weight, reps, volume, RPE, 1RM estimate
- [ ] Endurance: exercise, distance, duration, pace, HR, calories
- [ ] Speed/Agility: drill, reps, duration, rest, drill metrics
- [ ] Stretching: exercise, hold time, sets, intensity
- [ ] Sport: activity, duration, intensity, notes, performance

### 3.3 Export Destinations
- [ ] Download as file
- [ ] Share via system share sheet
- [ ] Email export (future)
- [ ] Google Sheets integration (future)

---

## Phase 4: Program & Template Improvements (Week 4-5)
*Goal: Easy program creation, editing, and management*

### 4.1 Program Builder UX
- [ ] Visual session calendar/schedule view
- [ ] Drag-to-reorder sessions and exercises
- [ ] Clone/duplicate programs and sessions
- [ ] Program tags and categories

### 4.2 Template System
- [ ] Save any workout as template
- [ ] Template library with search/filter
- [ ] Community templates (future - requires sharing)
- [ ] Quick-apply template to any date

### 4.3 Program Execution
- [ ] "Start Workout" from program session
- [ ] Progress indicator through session
- [ ] Auto-advance to next exercise
- [ ] Session completion summary

---

## Phase 5: Coaching & Team Features (Week 5-7)
*Goal: Enable coaches to manage athletes and share programs*

### 5.1 User Roles
- [ ] Add `role` field to user profile: 'athlete' | 'coach' | 'both'
- [ ] Coach dashboard route
- [ ] Role-based navigation

### 5.2 Team Management
- [ ] Create team/group
- [ ] Invite athletes via email/link
- [ ] Athlete accepts invitation
- [ ] View team roster

### 5.3 Program Sharing
- [ ] Share program with team or individual
- [ ] Shared programs appear in athlete's library
- [ ] Coach can update shared programs
- [ ] Athletes see assigned programs

### 5.4 Athlete Monitoring
- [ ] Coach views athlete's workout logs (read-only)
- [ ] Weekly/monthly summary per athlete
- [ ] Training load comparison across team
- [ ] Activity completion status

---

## Phase 6: Analytics & Progress Dashboard (Week 7-8)
*Goal: Visual progress tracking for athletes and coaches*

### 6.1 Athlete Dashboard
- [ ] Weekly training volume chart
- [ ] Personal records (PRs) display
- [ ] Exercise frequency heatmap
- [ ] Progress over time per exercise

### 6.2 Coach Dashboard
- [ ] Team overview with key metrics
- [ ] Athlete comparison charts
- [ ] Training load distribution
- [ ] Alerts for missing workouts

### 6.3 Detailed Analytics
- [ ] 1RM progression charts
- [ ] Volume by muscle group
- [ ] Activity type distribution
- [ ] Rest day patterns

---

## Database Schema Updates

### New Collections

```typescript
// teams/{teamId}
interface Team {
  id: string;
  name: string;
  coachId: string;
  createdAt: Timestamp;
  inviteCode?: string;
}

// teams/{teamId}/members/{memberId}
interface TeamMember {
  id: string;
  athleteId: string;  // References users/{userId}
  role: 'athlete' | 'assistant_coach';
  joinedAt: Timestamp;
  status: 'active' | 'invited' | 'removed';
}

// sharedPrograms/{programId}
interface SharedProgram {
  id: string;
  originalProgramId: string;
  sharedBy: string;  // Coach userId
  sharedWith: string[];  // Athlete userIds or teamId
  permissions: 'view' | 'copy';
  createdAt: Timestamp;
}
```

### User Profile Updates
```typescript
interface UserProfile {
  // ... existing fields
  role: 'athlete' | 'coach' | 'both';
  teamIds?: string[];  // Teams user belongs to
  coachingTeamIds?: string[];  // Teams user coaches
}
```

---

## Firestore Rules Updates

```javascript
// Allow coaches to read athlete data they're connected to
match /users/{userId}/exercises/{exerciseId} {
  allow read: if isAuthenticated() && (
    isOwner(userId) || 
    isCoachOfAthlete(userId)
  );
}

function isCoachOfAthlete(athleteId) {
  return exists(/databases/$(database)/documents/teams/$(teamId)/members/$(athleteId));
}
```

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Inline set editing | High | Low | 🔴 P1 |
| Activity-specific forms | High | Medium | 🔴 P1 |
| Export date range | Medium | Low | 🟠 P2 |
| Activity-specific export | High | Medium | 🟠 P2 |
| Coach role & dashboard | High | High | 🟡 P3 |
| Team management | High | High | 🟡 P3 |
| Program sharing | High | Medium | 🟡 P3 |
| Analytics dashboard | Medium | High | 🟢 P4 |

---

## Success Metrics

1. **Logging Speed**: Time to log a complete workout < 5 minutes
2. **Export Utility**: Exported data is immediately usable in analysis tools
3. **Coach Adoption**: Coach can onboard a team in < 10 minutes
4. **Athlete Engagement**: Weekly active logging rate > 80%

---

## Technical Considerations

### Performance
- Lazy load analytics charts
- Paginate team member lists
- Cache frequently accessed data
- Optimize Firestore queries with composite indexes

### Security
- Validate all shared data access server-side
- Rate limit invitations
- Audit log for coach actions on athlete data

### Mobile Experience
- All features must work on mobile viewport
- Touch-friendly targets (min 44px)
- Offline-first for logging
- Sync indicator for pending changes

---

## Next Steps

1. Start with Phase 1.1 - Streamlined Exercise Logging
2. Use the prompts below to implement each feature
3. Test each phase before moving to next
4. Get user feedback after Phase 2 (core logging complete)
5. Iterate based on feedback before coaching features

