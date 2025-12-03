# Gatherly Architecture Documentation

## System Overview

Gatherly is a social event platform that enables users to "join alone" and get matched into micro-groups for attending events together. Built on React + Vite + Supabase (Lovable Cloud).

## Consolidation Status (Phase 1-7 Complete)

### Completed Consolidations:
- **Phase 1**: Database schema normalized with `join_status`, `attendance_status`, unique constraints, freeze triggers
- **Phase 2**: Shared utilities layer (`_shared/` with responses, permissions, freeze, scoring, moderation, attendance, notifications)
- **Phase 3**: Edge functions standardized with `{ success, data, error }` responses and error codes (E.FREEZE, E.AUTH, etc.)
- **Phase 4**: Freeze-aware UI components (FreezeStatus, FreezeCountdown, freeze guards on join)
- **Phase 5**: Stale group cleanup job (`cleanup-stale-groups` function)
- **Phase 6**: Attendance QR hardening with checksum, event binding, and expiry
- **Phase 7**: Moderation with fallback profanity wordlist and muted state UI

## Core Modules

### 1. Matching Engine (`supabase/functions/join-event`)
- **Purpose**: Matches users into compatible micro-groups based on interests, social energy, and location
- **Algorithm**: Greedy best-score with Jaccard similarity for interests
- **Features**:
  - Idempotency check (prevents duplicate joins)
  - Freeze-state blocking (blocks joins after freeze window)
  - Group status management (forming → locked)

### 2. Recurring Events (`supabase/functions/generate-recurring-events`)
- **Purpose**: Auto-generates event instances from recurring series
- **Features**:
  - Weekly/monthly recurrence patterns
  - Parent-child event relationship
  - Recurrence time configuration

### 3. Organizer Management (`supabase/functions/org-management`)
- **Purpose**: Handles organization CRUD and team management
- **Roles**: `org_owner`, `org_admin`, `org_helper`
- **Features**:
  - Permission-based access control
  - Activity logging
  - Team invitation system

### 4. Group Freeze System (`supabase/functions/regenerate-groups`)
- **Purpose**: Locks groups before events to prevent last-minute changes
- **Features**:
  - Configurable freeze window (default 2 hours before event)
  - Manual freeze/unfreeze by organizers
  - Blocks all join/leave operations when frozen

### 5. Moderation (`supabase/functions/moderation`)
- **Purpose**: Content moderation for group chat messages
- **Features**:
  - AI-powered moderation via Lovable AI (Gemini)
  - Fallback profanity wordlist when AI unavailable
  - Auto-mute for violations (10 minutes)
  - Auto-report generation

### 6. Attendance & Engagement (`supabase/functions/track-engagement`)
- **Purpose**: Track event attendance and gamification
- **Features**:
  - Check-in with time validation (30 min before to 60 min after)
  - Duplicate check-in prevention
  - Weekly streak tracking
  - Badge awarding system

### 7. Recommendations (`supabase/functions/recommended-events`)
- **Purpose**: AI-powered event recommendations
- **Features**:
  - Vibe score calculation
  - Interest-based matching
  - Location proximity scoring

### 8. Push Notifications (`supabase/functions/send-notification`)
- **Purpose**: Web push notifications
- **Features**:
  - VAPID-based web push
  - Event reminder notifications
  - Group assignment notifications

## Database Schema

### Core Tables
- `profiles` - User profiles with interests, social energy, location
- `events` - Event details with recurrence settings
- `event_participants` - User-event join records
- `micro_groups` - Matched groups for events
- `micro_group_members` - Group membership
- `messages` - Group chat messages
- `orgs` - Community organizations
- `user_roles` - Role-based access control

### Engagement Tables
- `attendance_records` - Check-in records
- `user_streaks` - Weekly attendance streaks
- `badge_definitions` - Badge templates
- `user_badges` - Awarded badges
- `community_feed` - Activity feed items

### Moderation Tables
- `reports` - User reports
- `user_mutes` - Temporary mutes
- `user_bans` - User bans

## API Endpoints

### Events
- `GET /events` - List events
- `GET /events/:id` - Event details
- `POST /functions/v1/join-event` - Join event (triggers matching)

### Groups
- `GET /micro_groups` - User's groups
- `POST /functions/v1/regenerate-groups` - Regenerate/freeze groups

### Chat
- `GET /messages` - Group messages
- `POST /functions/v1/moderation?action=check` - Check message
- `POST /functions/v1/moderation?action=send` - Send moderated message

### Engagement
- `POST /functions/v1/track-engagement` - Check-in / get stats

### Organizations
- `POST /functions/v1/org-management` - All org operations

## Integration Flows

### Join Alone Flow
```
User clicks "Join Alone"
  → EventDetail.tsx calls join-event function
  → Function checks freeze status
  → Function creates event_participants record
  → Function runs matching algorithm
  → Function creates/updates micro_group
  → User sees group in Groups.tsx
  → User can chat in GroupChat.tsx
```

### Check-In Flow
```
Event is happening (within time window)
  → User sees "Check In" button in EventDetail.tsx
  → track-engagement validates time window
  → Creates attendance_records entry
  → Updates user_streaks
  → Awards badges if criteria met
  → Posts to community_feed if badge earned
```

### Moderation Flow
```
User sends message
  → useRealtimeChat calls moderation?action=check
  → AI moderation (or fallback wordlist)
  → If flagged: auto-mute user, create report
  → If clean: insert message
  → Realtime subscription updates all clients
```

## Embed Widgets

Embeddable widgets for external sites (`public/embed.js`):
- `<gatherly-join event-id="...">` - Join button
- `<gatherly-countdown event-id="...">` - Event countdown
- `<gatherly-events org-handle="...">` - Events strip

Deep links: `/event/:id?autojoin=true` - Auto-triggers join flow

## Security

### RLS Policies
- All tables have row-level security enabled
- User data scoped to `auth.uid()`
- Org data scoped via `user_roles` membership
- Service role used in edge functions for cross-user operations

### Role Hierarchy
1. `admin` - Platform admin
2. `org_owner` - Full org control
3. `org_admin` - Manage events/members
4. `org_helper` - View-only access
5. `user` - Regular user

## Observability

### Logging
- All edge functions log key operations with `[function-name]` prefix
- Analytics events logged as `[analytics]` for aggregation
- Error logs include context for debugging

### Metrics (planned)
- PostHog events for user journey tracking
- Group formation success rate
- Check-in completion rate
- Moderation flag rate

## Testing Strategy

### Unit Tests (planned)
- Matching algorithm scoring
- Streak calculation logic
- Badge criteria checking

### Integration Tests (planned)
- Full join → match → chat flow
- Recurring event generation
- Role permission enforcement

### E2E Tests (planned)
- Cypress tests for critical user paths
- Widget embedding verification
