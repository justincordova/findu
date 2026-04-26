# FindU - College Dating & Social Discovery App

![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-55-000020?logo=expo&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-iOS%20%26%20Android-lightgrey?logo=apple&logoColor=white)

## Project Overview

FindU is a mobile-first social discovery and dating app built exclusively for college students. Focused on authenticity and safety, it helps students connect through their campus community, shared interests, and personal goals without the distractions of generic dating platforms.

### Core Mission

> Create a trusted, community-driven dating platform for college students, verified through their `.edu` email, where they can meet peers from their campus or nearby universities with meaningful intent.

---

## Tech Stack

| Layer              | Technology            | Purpose                            |
| ------------------ | --------------------- | ---------------------------------- |
| Frontend           | React Native + Expo (SDK 55) | Cross-platform mobile app          |
| State Management   | Zustand               | Lightweight state management       |
| Backend            | Node.js + Express 5   | API server                         |
| Real-time          | Socket.IO             | Live messaging & typing indicators |
| Authentication     | Better Auth           | Email verification & session auth  |
| Database           | Supabase (PostgreSQL) | Primary data storage               |
| ORM                | Prisma 7              | Database access with driver adapter|
| Cache / Queue      | Redis                 | Caching, sessions, job queues      |
| File Storage       | Supabase Storage      | Profile pictures, chat media       |
| Linting            | Biome                 | Linting and formatting             |

---

## Demo

<p align="center">
  <img src="./docs/demo/demo.gif" width="280" alt="FindU Demo">
</p>

---

## App Features

### Authentication
- Email/password login
- `.edu` email verification
- User registration and profile setup
- JWT-based session management

### Profile Management
- Multi-step onboarding (photos, bio, interests)
- Campus and school selection
- Intent-based filtering (dating, friendship, etc.)
- Profile editing and photo management
- Lifestyle preferences

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

### Lifestyle
- Lifestyle preference matching (drinking, smoking, etc.)
- Profile lifestyle section editing

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

## Planned Features

- Report functionality
- Photo verification
- Campus-only visibility periods
- Advanced moderation tools
- Subscription tiers (Bachelors, Masters, PhD)
- Boost functionality
- SuperLikes and Icebreakers
- Instagram/Spotify integration
- Group events and meetups
- Campus-specific activities

---

## Contact & Support

- **Email**: findu.team@gmail.com
- **Project Status**: Beta
- **Platform**: iOS & Android
- **Target Audience**: College students (18-26)

---

## License

This project is licensed under the MIT License.

MIT License

Copyright (c) 2025 Justin Cordova

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
