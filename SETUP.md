# FindU Setup Guide

## **Getting Started**

### **Prerequisites**

- Node.js 18+
- Expo CLI
- Supabase account
- Stripe account (for payments)

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
# Configure Supabase, Stripe, and other services
```

### **Running the App**

```bash
# Start the backend
cd server && npm run dev

# Start the mobile app
cd client && npx expo start
```

## **Environment Variables**

Create a `.env` file in both `client/` and `server/` directories with the following variables: