# FindU

**Dating App for Verified College Students Only**

*Discover real connections on your campus.*

---

## Core Idea

> Create a **trusted, community-driven dating platform** for college students, verified through their `.edu` email, where they can meet peers from their campus or nearby universities with meaningful intent.

---

## User Flow

1. **Download & Onboard**  
   - Download from App Store or Play Store  
   - Intro tutorial on privacy, purpose, and safety  
   - Signup with `.edu` email verification  

2. **Profile Setup**  
   - Add photos, bio, major, graduation year  
   - Choose interests and intent (dating, friendship, etc.)  
   - Optionally link Instagram or Spotify  

3. **Discovery**  
   - Browse verified students from your campus or nearby schools  
   - Swipe or double-tap to like  
   - View compatibility score based on shared interests & goals  

4. **Match & Chat**  
   - Mutual likes create a match  
   - In-app chat opens  
   - Icebreaker prompts help start conversations  

5. **Safety Features**  
   - Report/block users  
   - Option to blur photos for privacy  
   - Time-limited campus-only visibility  

6. **Optional Upgrades**  
   - See who liked you  
   - Boost profile visibility  
   - Send SuperLikes or Icebreakers  

---

## Features

- **Verified Students Only** via `.edu` emails  
- **Campus-Based Matching**  
- **Private & Secure Profiles**  
- **Smart Matching Algorithm**  
- **Icebreakers & Safe Chat**  
- **Built-in Reporting & Moderation**  
- **No Bots, Creeps, or Catfishing**  
- **Intent-Based Filtering** (Dating, Friendship, Study Buddy)  

---

## Monetization Overview

| Revenue Source           | How it Works                              | Powered By    |
|--------------------------|------------------------------------------|---------------|
| Campus Boosts            | Users pay to boost visibility to nearby users | Stripe        |
| SuperLikes / Icebreakers | One-time purchases to stand out          | Stripe        |
| Premium Subscription     | See who liked you, unlimited swipes, rewind | Stripe Billing |
| Tips / Donations         | Users can support the project             | Stripe        |

---

## Target Audience

- **College Students (18–25 years old)**  
- Seeking relationships, friendship, networking  
- Campus-limited discovery for safety & authenticity  
- Priority on large universities & community colleges with active social life  

---

## Tech Stack

| Layer           | Tool / Tech              | Notes                             |
|-----------------|--------------------------|----------------------------------|
| **Frontend**    | React Native + Expo      | Cross-platform native apps       |
| **Styling**     | Tailwind CSS             | Via Tailwind for React Native    |
| **State Mgmt**  | ZuStand                  | Lightweight and scalable         |
| **Backend**     | Fastify                  | Handles auth, payments, moderation|
| **Auth**        | Magic Link / OTP via Supabase | Custom login/signup (MFA-ready)  |
| **Database**    | Supabase (PostgreSQL)    | Schema with RLS for security     |
| **Payments**    | Stripe Billing & Checkout| Subscriptions, boosts, tips      |
| **Storage**     | Supabase Storage (optional) | Profile pics, chat images       |
| **Hosting**     | Vercel + Render                   | Backend dashboard, landing site  |

---