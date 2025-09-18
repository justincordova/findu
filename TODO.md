# To-Do

## Completed
- [x] Supabase auth configured (signup with Nodemailer)
- [x] Supabase auth login working
- [x] Frontend auth integrated with global Zustand store
- [x] Backend API CRUD implemented for profiles, likes, matches, discover
- [x] Storage API implemented for file uploads

## To Do
- [ ] Implement college/email domain mapping  
  - Start with: NJIT, Rutgers, Northeastern, Boston  
  - Ensure users are locked to colleges based on email domain  
  - Support multiple campuses per college (user selects campus if applicable)  
  - Make mapping scalable for future colleges  
- [ ] Implement working discover algorithm based on profile preferences
- [ ] Create minimum 10 sample users (auth + profiles)
- [ ] Create unit tests for:
  - [x] Profiles API
  - [x] Likes API
  - [x] Matches API
  - [ ] Discover API
  - [x] Storage API
- [ ] Build frontend UI for discover page and matching flow
- [ ] Perform QA:
  - [ ] Integration tests for full flow: signup -> profile -> upload -> discover -> like -> match
  - [ ] Edge case testing: duplicate likes, blocked users, deleted profiles
  - [ ] E2E smoke tests for frontend discover and matching
  - [ ] Load/performance testing for discover endpoint
