# To-Do — Matching Service (Supabase + Node + Frontend)

## Completed
- [x] Supabase auth configured (signup flow uses Nodemailer service for verification)
- [x] Supabase auth login working
- [x] Frontend auth integration hooked into a global Zustand auth store

---

## In Progress
- [ ] Backend API: CRUD for profiles, likes, matches, discover  
  - [ ] Define DB schema (profiles, likes, matches, photos, preferences)  
  - [ ] Implement controllers & routes  
  - [ ] Add input validation & auth guards  
- [ ] Storage API for uploading profile images/files  
  - [ ] Signed upload URLs / policy  
  - [ ] Integration tests for uploads  
- [ ] Seed: create minimum 10 sample users (auth + profiles)  
- [ ] Create first working version of the matching system  
  - [ ] Like flow  
  - [ ] Matching logic (mutual likes -> match)  
  - [ ] Basic scoring for discover results  

---

## High Priority (next sprint)
- [ ] Test backend: likes, matches, discover (unit + integration)  
- [ ] Import backend endpoints into frontend  
  - [ ] Connect discover endpoint to UI  
  - [ ] Wire like/unlike actions from frontend -> API  
  - [ ] Wire match notifications/events  
- [ ] Basic UI for discover & match screens (mobile-first)  

---

## Testing & QA
- [ ] Unit tests for:  
  - [ ] `createProfile`, `updateProfile`, `getProfile`  
  - [ ] `likeUser`, `unlikeUser`  
  - [ ] `checkForMatch` (mutual like detection)  
  - [ ] `discover` scoring & pagination  
- [ ] Integration tests:  
  - [ ] Full sign-up -> profile create -> upload image -> discover flow  
  - [ ] Like flow: A likes B, B likes A -> match created  
  - [ ] Edge cases: blocked users, duplicate likes, deleted profiles  
- [ ] E2E smoke test for frontend flows (signup, login, discover, like, match)  
- [ ] Load test discover endpoint with seeded users (simulate 1000 requests/min)  

---

## Dev tasks / Implementation notes

### DB schema (outline)
- `profiles` (id PK, user_id FK, display_name, bio, age, gender, prefs JSON, created_at, updated_at)  
- `likes` (id PK, from_user, to_user, status ENUM('liked'), created_at)  
- `matches` (id PK, user_a, user_b, created_at, metadata JSON)  
- `photos` (id, profile_id, storage_path, order, created_at)  

### Matching logic (basic algorithm)
1. When user A likes user B -> upsert into `likes`.  
2. On like creation, check if `likes` exists where `from_user = B` and `to_user = A`.  
3. If mutual, create `match` record (ensure deterministic ordering of user ids to avoid duplicates), notify both users.  
4. Discover endpoint returns candidates excluding:  
   - yourself  
   - users in excludedIds (blocked, already matched, already liked/likedBy depending on UX)  
   - sorted by a simple score: shared_prefs + activity_score + randomness  
