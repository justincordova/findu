# FindU - College Dating App MVP

## **Project Overview**

**FindU** is a mobile-first dating app exclusively for college students. Designed for authenticity and safety, it connects users based on their campus, interests, and goals—without the noise of generic dating apps.

### **Core Mission**

> Create a **trusted, community-driven dating platform** for college students, verified through their `.edu` email, where they can meet peers from their campus or nearby universities with meaningful intent.

---

## **Tech Stack**

| Layer                | Technology            | Purpose                          |
| -------------------- | --------------------- | -------------------------------- |
| **Frontend**         | React Native + Expo   | Cross-platform mobile app        |
| **State Management** | Zustand               | Lightweight state management     |
| **Backend**          | Node.js + Express     | API server                       |
| **Authentication**   | Supabase Auth         | Email verification & magic links |
| **Database**         | Supabase (PostgreSQL) | Primary data storage             |
| **Payments**         | Stripe                | Subscriptions, boosts, tips      |
| **File Storage**     | Supabase Storage      | Profile pictures, chat images    |
| **Hosting**          | Render                | Backend deployment               |

---

## **Features**

- **Authentication System**
  - Email/password and magic link login
  - `.edu` email verification
  - User registration and profile setup
- **Profile Management**
  - Multi-step onboarding (photos, bio, interests)
  - Campus and school selection
  - Intent-based filtering (dating, friendship, etc.)
- **Discovery System**
  - Swipe-based matching interface
  - Campus-based user filtering
  - Interest-based compatibility scoring
- **Matching & Messaging**
  - Mutual like detection
  - In-app chat functionality
  - Message history and read status
- **Safety Features**
  - User blocking system
  - Report functionality
  - Privacy controls
- **Premium Features**
  - Subscription tiers (Bachelors, Masters, PhD)
  - Boost functionality
  - SuperLikes and Icebreakers
- **Payment Integration**
  - Stripe subscription management
  - One-time purchases (boosts, tips)
- **Enhanced Safety**
  - Photo verification
  - Campus-only visibility periods
  - Advanced moderation tools
- **Social Features**
  - Instagram/Spotify integration
  - Group events and meetups
  - Campus-specific activities
- **Analytics & Insights**
  - User behavior analytics
  - Match success tracking
  - Campus engagement metrics

---

## **Database Schema**

### **Key Relationships**

- Users can have one profile
- Users can like multiple other users
- Matches are created when likes are mutual
- Chats are linked to matches
- Blocks prevent interactions between users

---

## **User Journey**

### **1. Onboarding**

```
Download App → Email Verification → Profile Setup → Campus Selection → Ready to Discover
```

### **2. Discovery**

```
Browse Profiles → Swipe Right/Left → View Compatibility → Send Like → Wait for Match
```

### **3. Matching**

```
Mutual Like → Match Notification → Open Chat → Start Conversation → Meet in Person
```

### **4. Safety & Moderation**

```
Report User → Admin Review → Action Taken → Community Guidelines Enforced
```

---

## **Monetization Strategy**

| Revenue Stream            | Description                                      | Status         |
| ------------------------- | ------------------------------------------------ | -------------- |
| **Premium Subscriptions** | Bachelors ($4.99), Masters ($9.99), PhD ($14.99) | 🚧 In Progress |
| **Campus Boosts**         | Pay to increase visibility to nearby users       | 📋 Planned     |
| **SuperLikes**            | Stand out with premium like feature              | 📋 Planned     |
| **Tips/Donations**        | Support the platform development                 | 📋 Planned     |

---

## **Key Differentiators**

1. **Campus-Exclusive** - Only verified college students
2. **Safety-First** - Built-in moderation and reporting
3. **Intent-Based** - Clear relationship goals and expectations
4. **Community-Driven** - Campus-specific features and events
5. **No Bots/Catfishing** - Email verification and photo requirements

---

---

## **Getting Started**

See [SETUP.md](./SETUP.md) for detailed setup instructions.

---

---

## **Contact & Support**

- **Project Status**: Active Development
- **Platform**: iOS & Android
- **Target Audience**: College students (18-25)
