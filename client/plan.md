app/
├── _layout.tsx                     # Root layout for global logic (auth check, safe area, etc.)
├── index.tsx                       # Entry page (logo, Get Started, Login, Signup buttons)

├── onboarding/
│   ├── index.tsx                   # App tutorial info, slides
│   └── [afterInfo].ts              # (Optional redirect to signup/login)

├── auth/
│   └── login-signup.tsx            # Single screen w/ toggle for login/signup (based on state or params)

├── profile-setup/
│   ├── index.tsx                   # Brief profile questions flow
│   └── [step].tsx                  # Optional if you break questions into steps

├── home/
│   └── _layout.tsx                 # Wraps the bottom tab navigator + top navbar (logo + settings)
│   └── (tabs)/                     # Bottom tab navigation: Discover, Matches, Messages, Profile
│       ├── _layout.tsx             # Tab bar setup (icons, colors)
│       ├── discover.tsx            # Tinder-style swiping interface
│       ├── matches.tsx             # List of mutual matches (click to message)
│       ├── messages.tsx            # List of conversations + search bar
│       └── profile.tsx             # User profile view & buttons

├── matches/
│   └── [userId].tsx                # Message screen with a matched user

├── settings/
│   ├── account.tsx                 # Edit email, password, etc.
│   ├── edit-profile.tsx           # Update photo, bio, interests
│   └── preferences.tsx            # (Optional) Discovery filters, distance, gender, etc.

---

components/
├── auth/
│   └── LoginForm.tsx
│   └── SignupForm.tsx

├── shared/
│   ├── TopNavBar.tsx              # Top bar with logo (left) and settings (right)
│   ├── BottomTabs.tsx             # (If needed outside Router auto-tabs)
│   ├── SectionTitle.tsx

├── discover/
│   ├── MatchCard.tsx              # Swipable user profile card
│   └── NoMoreMatches.tsx

├── matches/
│   └── MatchListItem.tsx          # User preview in match list

├── messages/
│   └── MessageCard.tsx            # Conversation preview
│   └── MessageSearchBar.tsx

├── profile/
│   ├── ProfileSummary.tsx         # Photo, major, college, year
│   ├── AboutMeBox.tsx
│   ├── InterestTags.tsx
│   └── Button.tsx
