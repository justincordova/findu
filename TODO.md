# To-Do — Matching App

## Completed
- [x] Supabase auth configured (signup with Nodemailer)
- [x] Supabase auth login working
- [x] Frontend auth integrated with global Zustand store
- [x] Backend API CRUD implemented for profiles, likes, matches, discover
- [x] Storage API implemented for file uploads

## To Do
- [ ] Create minimum 10 sample users (auth + profiles)
- [ ] Implement working discover algorithm based on profile preferences
- [ ] Create unit tests for:
  - [ ] Profiles API
  - [ ] Likes API
  - [ ] Matches API
  - [ ] Discover API
  - [ ] Storage API
- [ ] Build frontend UI for discover page and matching flow
- [ ] Perform QA:
  - [ ] Integration tests for full flow: signup -> profile -> upload -> discover -> like -> match
  - [ ] Edge case testing: duplicate likes, blocked users, deleted profiles
  - [ ] E2E smoke tests for frontend discover and matching
  - [ ] Load/performance testing for discover endpoint
