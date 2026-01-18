# FindU - College Dating & Social Discovery App

## Project Overview

FindU is a mobile-first social discovery and dating app built exclusively for college students. Focused on authenticity and safety, it helps students connect through their campus community, shared interests, and personal goals without the distractions of generic dating platforms.

### Core Mission

> Create a trusted, community-driven dating platform for college students, verified through their `.edu` email, where they can meet peers from their campus or nearby universities with meaningful intent.

---

## Tech Stack

| Layer              | Technology            | Purpose                            |
| ------------------ | --------------------- | ---------------------------------- |
| Frontend           | React Native + Expo   | Cross-platform mobile app          |
| State Management   | Zustand               | Lightweight state management       |
| Backend            | Node.js + Express     | API server                         |
| Real-time          | Socket.IO             | Live messaging & typing indicators |
| Authentication     | Better Auth           | Email verification & magic links   |
| Database           | Supabase (PostgreSQL) | Primary data storage               |
| Cache / Queue      | Redis                 | Caching, sessions, job queues      |
| File Storage       | Supabase Storage      | Profile pictures, chat media       |
| Hosting            | Render                | Backend deployment                 |

---

## Demo

[Watch Demo Video](./docs/demo/demo.mp4)

---

## App Features

### Authentication
- Email/password and magic link login
- `.edu` email verification
- User registration and profile setup
- Secure session management

### Profile Management
- Multi-step onboarding (photos, bio, interests)
- Campus and school selection
- Intent-based filtering (dating, friendship, etc.)
- Profile editing and photo management

### Discovery
- Swipe-based matching interface
- Campus-based user filtering
- Interest-based compatibility scoring
- Cached feed for performance

### Matching
- Mutual like detection with real-time notifications
- Match management (view, unmatch)
- Match history tracking

### Messaging
- Socket.IO-powered live chat
- Message history with pagination
- Typing indicators
- Read receipts
- Message editing and deletion
- Media sharing (images)
- Conversation list with latest message preview
- Unread message indicators

### Safety
- User blocking system
- Block cleanup (auto-remove likes/matches)
- Privacy controls

---

## Architecture Highlights

### Real-time Messaging
- Socket.IO integration for instant message delivery
- Automatic room management (users join match rooms on chat open)
- Message deduplication to prevent duplicates
- Offline user handling with graceful degradation
- Optimistic UI updates for better UX

### Performance Optimizations
- Redis caching for discover feed
- Message pagination (50 messages per fetch)
- Efficient database queries with proper indexing
- Zustand for lightweight state management

### Security
- Session-based authentication with Better Auth
- `.edu` email verification requirement
- Secure WebSocket connections
- Input validation and sanitization
- Block system with automatic cleanup

---

## Getting Started

See [SETUP.md](./SETUP.md) for detailed setup instructions.

---

## Project Structure

```
findu/
├── client/              # React Native mobile app
│   ├── app/            # Expo Router screens
│   ├── components/     # Reusable UI components
│   ├── store/          # Zustand state management
│   ├── api/            # API client functions
│   └── utils/          # Socket.IO and helpers
├── server/             # Node.js backend
│   ├── src/
│   │   ├── modules/    # Feature modules (auth, matches, chats, etc.)
│   │   ├── websocket/  # Socket.IO configuration
│   │   ├── middleware/ # Express middleware
│   │   └── lib/        # Shared utilities
│   └── prisma/         # Database schema and migrations
└── docs/               # Documentation and assets
```

---

## Planned Features

- Report functionality
- Photo verification
- Campus-only visibility periods
- Advanced moderation tools
- Subscription tiers (Bachelors, Masters, PhD)
- Boost functionality
- SuperLikes and Icebreakers
- Stripe payment integration
- Instagram/Spotify integration
- Group events and meetups
- Campus-specific activities

---

## Contact & Support

- **Email**: findu.team@gmail.com
- **Project Status**: Beta
- **Platform**: iOS & Android
- **Target Audience**: College students (18-26)
