# FindU Setup Guide

## **Getting Started**

### **Prerequisites**

- Node.js 18+
- Expo CLI
- Supabase account
- Stripe account (for payments)
- Redis server (for caching, session storage, and real-time features)

### **Environment Setup**

```bash
# Clone the repository
git clone https://github.com/JustinCordova/findu.git
cd findu

# Install dependencies
cd client && npm install
cd ../server && npm install

# Set up Prisma
cd server && npx prisma generate

# Set up environment variables
# Configure Supabase, Stripe, Email, Redis, and other services
# Start local redis server
