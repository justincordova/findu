# FindU – College Dating & Social Discovery App

## **Project Overview**

**FindU** is a mobile-first social discovery and dating app built exclusively for college students. Focused on authenticity and safety, it helps students connect through their campus community, shared interests, and personal goals without the distractions of generic dating platforms.

### **Core Mission**

> Create a **trusted, community-driven dating platform** for college students, verified through their `.edu` email, where they can meet peers from their campus or nearby universities with meaningful intent.

---

## **Tech Stack**

| Layer                | Technology            | Purpose                          |
| -------------------- | --------------------- | -------------------------------- |
| **Frontend**         | React Native + Expo   | Cross-platform mobile app        |
| **State Management** | Zustand               | Lightweight state management     |
| **Backend**          | Node.js + Express     | API server                       |
| **Real-time**        | Socket.IO             | Live messaging & typing indicators |
| **Authentication**   | Better Auth           | Email verification & magic links |
| **Database**         | Supabase (PostgreSQL) | Primary data storage             |
| **Cache / Queue**    | Redis                 | Caching, sessions, job queues    |
| **Payments**         | Stripe                | Subscriptions, boosts, tips      |
| **File Storage**     | Supabase Storage      | Profile pictures, chat media     |
| **Hosting**          | Render                | Backend deployment               |

---

## **Demo**

[📹 Watch Demo Video](./docs/demo/findu_demo.mp4)

> *Demo video showcasing the app's core features including authentication, profile setup, discovery, matching, and real-time messaging.*

---

## **Features**

### **✅ Completed Features**

- **Authentication System**
  - Email/password and magic link login
  - `.edu` email verification
  - User registration and profile setup
  - Secure session management

- **Profile Management**
  - Multi-step onboarding (photos, bio, interests)
  - Campus and school selection
  - Intent-based filtering (dating, friendship, etc.)
  - Profile editing and photo management

- **Discovery System**
  - Swipe-based matching interface
  - Campus-based user filtering
  - Interest-based compatibility scoring
  - Cached feed for performance

- **Matching System**
  - Mutual like detection with real-time notifications
  - Match management (view, unmatch)
  - Match history tracking

- **Real-time Messaging**
  - Socket.IO-powered live chat
  - Message history with pagination
  - Typing indicators
  - Read receipts
  - Message editing and deletion
  - Media sharing (images)
  - Conversation list with latest message preview
  - Unread message indicators

- **Safety Features**
  - User blocking system
  - Block cleanup (auto-remove likes/matches)
  - Privacy controls

### **🚧 Planned Features**

- **Enhanced Safety**
  - Report functionality
  - Photo verification
  - Campus-only visibility periods
  - Advanced moderation tools

- **Premium Features**
  - Subscription tiers (Bachelors, Masters, PhD)
  - Boost functionality
  - SuperLikes and Icebreakers

- **Payment Integration**
  - Stripe subscription management
  - One-time purchases (boosts, tips)

- **Social Features**
  - Instagram/Spotify integration
  - Group events and meetups
  - Campus-specific activities

- **Analytics & Insights**
  - User behavior analytics
  - Match success tracking
  - Campus engagement metrics

---

## **User Journey**

### **1. Onboarding**

```
Download App → Sign Up via OTP → Email Verification → Profile Setup → Campus Selection → Discover Matches
```

### **2. Discovery**

```
Browse Profiles → Swipe Right/Left → View Compatibility → Send Like → Mutual Like → Match!
```

### **3. Matching & Messaging**

```
Match Notification → View Match → Open Chat → Real-time Messaging → Typing Indicators → Read Receipts
```

### **4. Safety & Moderation**

```
Block User → Auto-remove Likes/Matches → Privacy Protected
```

---

## **Architecture Highlights**

### **Real-time Messaging**
- Socket.IO integration for instant message delivery
- Automatic room management (users join match rooms on chat open)
- Message deduplication to prevent duplicates
- Offline user handling with graceful degradation
- Optimistic UI updates for better UX

### **Performance Optimizations**
- Redis caching for discover feed
- Message pagination (50 messages per fetch)
- Efficient database queries with proper indexing
- Zustand for lightweight state management

### **Security**
- Session-based authentication with Better Auth
- `.edu` email verification requirement
- Secure WebSocket connections
- Input validation and sanitization
- Block system with automatic cleanup

---

## **Monetization**

| Revenue Stream            | Description                                      | Status     |
| ------------------------- | ------------------------------------------------ | ---------- |
| **Premium Subscriptions** | Bachelors ($4.99), Masters ($9.99), PhD ($14.99) | Planned |
| **Campus Boosts**         | Pay to increase visibility to nearby users       | Planned |
| **SuperLikes**            | Stand out with premium like feature              | Planned |
| **Tips/Donations**        | Support the platform development                 | Planned |

---

## **Getting Started**

See [SETUP.md](./SETUP.md) for detailed setup instructions.

---

## **Project Structure**

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

## **Contact & Support**

- **Email**: findu.team@gmail.com
- **Project Status**: Active Development
- **Platform**: iOS & Android
- **Target Audience**: College students (18-26)
