# Phase 5: Coaching & Team Features - Implementation Complete ✅

**Status:** All sub-phases implemented and integrated  
**Date:** $(date)

## Overview

Phase 5 introduces comprehensive coaching and team management capabilities, enabling coaches to create teams, invite athletes, and share training programs. Athletes can join teams via invite codes/links and receive assigned programs.

---

## 5.1 User Role System ✅

### Implementation
- **Hook:** [src/hooks/useUserRole.ts](src/hooks/useUserRole.ts)
  - `useUserRole()`: Returns current user's role ('athlete' | 'coach' | null)
  - `useIsCoach()`: Boolean check for coach role
  - `useIsAthlete()`: Boolean check for athlete role

- **Auth Service:** [src/services/firebase/auth.ts](src/services/firebase/auth.ts)
  - `updateUserRole(userId, role)`: Updates user role in Firestore and Auth profile

- **Settings UI:** [src/components/Settings.tsx](src/components/Settings.tsx)
  - Added role selector dropdown between Theme and Progressive Overload settings
  - Real-time role change with Redux state sync
  - Toast notifications on success/error

- **Registration:** [src/features/auth/Register.tsx](src/features/auth/Register.tsx)
  - Role selection dropdown already existed
  - Integrated with new role system

### Features
- Role-based access control throughout app
- Ability to change role post-registration
- Redux state synchronization for role changes

---

## 5.2 Team Creation & Management ✅

### Service Layer
**File:** [src/services/teamService.ts](src/services/teamService.ts) (400+ lines)

#### Data Structures
```typescript
interface Team {
  id: string;
  name: string;
  description?: string;
  coachId: string;
  coachName: string;
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface TeamMember {
  id: string;
  teamId: string;
  email: string;
  firstName: string;
  lastName: string;
  joinedAt: Date;
  status: 'active' | 'invited' | 'inactive';
}
```

#### Core Functions
- **Team CRUD:**
  - `createTeam(name, description?)`: Creates team with unique 6-char invite code
  - `getCoachTeams(coachId)`: Fetches all teams for a coach
  - `getTeam(teamId)`: Fetches single team details
  - `getTeamByInviteCode(code)`: Finds team by invite code
  - `updateTeam(teamId, updates)`: Updates team name/description
  - `deleteTeam(teamId)`: Soft-deletes team

- **Member Management:**
  - `getTeamMembers(teamId)`: Fetches all members of a team
  - `addTeamMember(teamId, memberData)`: Adds member to team
  - `removeTeamMember(teamId, memberId)`: Removes member from team
  - `joinTeam(teamId, inviteCode)`: Athlete joins team
  - `getAthleteTeams(userId)`: Fetches teams user is member of

- **Invite Code Generation:**
  - `generateInviteCode()`: 6-character alphanumeric code
  - Excludes confusing characters (O/0, I/1, l/L)
  - Uniqueness verification with up to 10 retry attempts

### UI Components

#### Create Team Modal
**File:** [src/features/teams/CreateTeamModal.tsx](src/features/teams/CreateTeamModal.tsx)
- Modal dialog for team creation
- Name input (max 50 chars) with validation
- Optional description textarea (max 200 chars)
- Loading states and error handling
- Callback on successful creation

#### Team List
**File:** [src/features/teams/TeamList.tsx](src/features/teams/TeamList.tsx)
- Grid layout of coach's teams
- Empty state with "Create Team" CTA
- Click to navigate to team detail
- Displays invite code and creation date on cards
- Protected route (coaches only)

#### Team Detail
**File:** [src/features/teams/TeamDetail.tsx](src/features/teams/TeamDetail.tsx)
- Detailed team management page
- **Edit capabilities:** Inline editing of team name and description
- **Invite code management:** Copy to clipboard (code + full link)
- **Member list:** Display all members with join dates
- **Member actions:** Remove members (with confirmation)
- **Delete team:** Delete with confirmation dialog
- **Security:** Verifies coach ownership before operations

---

## 5.3 Athlete Invitation Flow ✅

### Join Team Component
**File:** [src/features/teams/JoinTeam.tsx](src/features/teams/JoinTeam.tsx)

#### Features
- **URL Parameter Support:** `/join/:inviteCode` - code from URL
- **Manual Code Entry:** Form input for manual entry
- **Team Preview:** Shows team name, coach name before joining
- **Join Flow:**
  1. Parses invite code from URL or form
  2. Looks up team by code
  3. Displays team details
  4. Confirms join action
  5. Adds user as member
  6. Redirects to home

#### UI States
- Loading state while fetching team
- Team found - preview with join button
- Invalid code error message
- Success toast and navigation

#### Integration
- Accessible via shared links: `https://your-app.com/#/join/ABC123`
- Manual entry for codes shared via message/email
- Protected route (authenticated users only)

---

## 5.4 Coach Dashboard ✅

### Dashboard Component
**File:** [src/features/coach/CoachDashboard.tsx](src/features/coach/CoachDashboard.tsx)

#### Summary Statistics
Three gradient cards displaying:
1. **Total Teams:** Count of all teams
2. **Total Athletes:** Sum of members across all teams
3. **Avg Athletes/Team:** Calculated average

#### Quick Actions
- **View All Teams:** Navigate to `/teams`
- **Manage Programs:** Navigate to `/programs`

#### Team Grid
- Displays first 6 teams
- Each card shows:
  - Team name
  - Member count
  - Click to navigate to detail

#### Access Control
- Uses `useIsCoach()` hook
- Redirects non-coaches to home

---

## 5.5 Program Sharing (Already Complete)

Implemented in previous session with `/shared-programs` route.

**Note:** Future enhancement planned to integrate team member selector into `ShareProgramDialog.tsx` for easier program assignment to team members.

---

## Navigation & Routes ✅

### Routes Added
**File:** [src/routes.tsx](src/routes.tsx)

```typescript
// Lazy-loaded components
const TeamList = lazy(() => import('@/features/teams/TeamList'));
const TeamDetail = lazy(() => import('@/features/teams/TeamDetail'));
const JoinTeam = lazy(() => import('@/features/teams/JoinTeam'));
const CoachDashboard = lazy(() => import('@/features/coach/CoachDashboard'));

// Routes (all protected)
<Route path="/teams" element={<TeamList />} />
<Route path="/teams/:id" element={<TeamDetail />} />
<Route path="/join/:inviteCode?" element={<JoinTeam />} />
<Route path="/coach" element={<CoachDashboard />} />
```

### SideMenu Integration
**File:** [src/components/SideMenu.tsx](src/components/SideMenu.tsx)

Added conditional "Coach Tools" section:
- **Dashboard:** Navigate to `/coach`
- **My Teams:** Navigate to `/teams`
- Only visible when `useIsCoach()` returns true

---

## Security & Permissions ✅

### Firestore Security Rules
**File:** [firestore.rules](firestore.rules)

#### Teams Collection
```javascript
match /teams/{teamId} {
  // Read: Coach or team member
  allow read: if isAuthenticated() && (
    resource.data.coachId == request.auth.uid ||
    isTeamMember(teamId)
  );
  
  // Create: Must set self as coach
  allow create: if isAuthenticated() && 
    request.resource.data.coachId == request.auth.uid;
  
  // Update/Delete: Coach only
  allow update, delete: if isAuthenticated() && 
    resource.data.coachId == request.auth.uid;
}
```

#### Members Subcollection
```javascript
match /members/{memberId} {
  // Read: Coach, self, or team member
  allow read: if isAuthenticated() && (
    coachOwnsTeam || 
    memberId == request.auth.uid ||
    isTeamMember
  );
  
  // Create: Coach or self (when joining)
  allow create: if isAuthenticated() && (
    coachOwnsTeam || 
    memberId == request.auth.uid
  );
  
  // Update: Coach only
  allow update: if isAuthenticated() && coachOwnsTeam;
  
  // Delete: Coach or self (when leaving)
  allow delete: if isAuthenticated() && (
    coachOwnsTeam || 
    memberId == request.auth.uid
  );
}
```

---

## Testing Checklist

### Role System
- [ ] Register as coach - verify role is set
- [ ] Register as athlete - verify role is set
- [ ] Change role in Settings - verify Redux state updates
- [ ] Verify coach-only routes redirect for athletes
- [ ] Verify SideMenu shows/hides "Coach Tools" based on role

### Team Creation & Management
- [ ] Create team as coach - verify invite code generation
- [ ] View team list - verify all teams displayed
- [ ] Edit team name/description - verify updates
- [ ] Copy invite code - verify clipboard functionality
- [ ] Copy invite link - verify full URL copied
- [ ] Delete team - verify confirmation and deletion
- [ ] Test duplicate team names (should be allowed)

### Member Management
- [ ] View team members - verify list displays
- [ ] Remove member - verify confirmation and removal
- [ ] Verify member count updates after add/remove

### Athlete Invitation
- [ ] Share invite link - `/join/ABC123`
- [ ] Join team via URL parameter - verify auto-fill
- [ ] Join team via manual code entry - verify lookup
- [ ] Test invalid code - verify error message
- [ ] Verify member added to team after join
- [ ] Verify athlete redirected to home after join

### Coach Dashboard
- [ ] Verify summary statistics calculate correctly
- [ ] Test with 0 teams - verify empty state
- [ ] Test with multiple teams - verify grid display
- [ ] Click team card - verify navigation to detail
- [ ] Test quick actions - verify navigation to teams/programs

### Integration
- [ ] Verify SharedProgramList still works
- [ ] Test program sharing flow with team members (manual for now)
- [ ] Verify all routes protected by authentication

---

## Future Enhancements

### Short-term
1. **Update ShareProgramDialog:**
   - Replace manual user ID textarea
   - Add team member selector dropdown
   - Fetch members from `teamService.getTeamMembers()`
   - Multi-select for bulk program assignment

2. **Team Management Enhancements:**
   - Bulk member removal
   - Member search/filter
   - Export member list
   - Member activity tracking

### Medium-term
3. **Athlete Dashboard:**
   - View joined teams
   - Leave team functionality
   - View assigned programs by team

4. **Notifications:**
   - Notify athletes when programs assigned
   - Notify coaches when athletes join teams
   - In-app notification system

5. **Analytics:**
   - Track athlete progress across teams
   - Team-wide statistics
   - Coach performance insights

### Long-term
6. **Advanced Coaching Features:**
   - Team-wide program templates
   - Bulk program assignment
   - Program scheduling calendar
   - Communication/messaging between coach and athletes

7. **Mobile App:**
   - Push notifications for assignments
   - Offline team data access
   - Mobile-optimized coach dashboard

---

## Deployment Notes

### Firebase Console Tasks
1. **Deploy Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```
   Or manually copy rules from `firestore.rules` to Firebase Console

2. **Create Firestore Indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```
   Or manually create indexes in Firebase Console if queries require them:
   - `teams` collection: Compound index on `coachId` + `createdAt`
   - `teams/{teamId}/members` subcollection: Single field index on `joinedAt`

### Build & Deploy App
```bash
npm run build
npm run deploy
```

### Verification Steps
1. Test role selection during registration
2. Create test team as coach
3. Share invite link to test account
4. Join team as athlete
5. Verify Firestore security rules in Firebase Console
6. Check that unauthorized access is blocked

---

## Files Modified/Created

### Created
- `src/hooks/useUserRole.ts` - Role access hooks
- `src/services/teamService.ts` - Team management service
- `src/features/teams/CreateTeamModal.tsx` - Create team modal
- `src/features/teams/TeamList.tsx` - Team list view
- `src/features/teams/TeamDetail.tsx` - Team detail/management
- `src/features/teams/JoinTeam.tsx` - Athlete join flow
- `src/features/coach/CoachDashboard.tsx` - Coach overview

### Modified
- `src/services/firebase/auth.ts` - Added `updateUserRole()`
- `src/components/Settings.tsx` - Added role selector
- `src/components/SideMenu.tsx` - Added coach navigation section
- `src/routes.tsx` - Added 4 new protected routes
- `firestore.rules` - Added teams collection security rules

---

## Summary

Phase 5 implementation is **complete and ready for testing**. The coaching and team features provide a solid foundation for:

✅ Role-based access control (Coach/Athlete)  
✅ Team creation and management with invite codes  
✅ Seamless athlete invitation flow via links or codes  
✅ Comprehensive coach dashboard with team overview  
✅ Secure Firestore rules protecting team data  
✅ Integrated navigation with role-based menus  

**Next Steps:**
1. Deploy Firestore rules to production
2. Conduct end-to-end testing across user flows
3. Optional: Enhance ShareProgramDialog with team member selector
4. Gather feedback and iterate on UX improvements

🎉 **Phase 5 Complete!**
