# DevButton Component

A development utility button that bypasses authentication for easy testing and design purposes.

## Features

- **Bypass Authentication**: Click to automatically log in with a fake user
- **Route Navigation**: Navigate to any page without auth restrictions
- **Visual Feedback**: Button changes color and shows checkmark when active
- **Easy Reset**: Long press to clear dev mode and return to login

## Usage

### Basic Usage

```tsx
// Navigate to default route (discover tab)
<DevButton />

// Navigate to specific route
<DevButton route="/home/(tabs)/profile" />

// Navigate to route with URL params
<DevButton route="/matches/123" />
```

### URL Parameter Usage

```tsx
// In your screen, add route param
router.push({ pathname: "/some-screen", params: { route: "/target-route" } });

// DevButton will use the route param
<DevButton />;
```

## How It Works

1. **Click DevButton**: Creates fake Supabase User and Session
2. **Bypass Auth**: Sets `isLoggedIn: true` in auth store
3. **Navigate**: Routes to specified page without auth restrictions
4. **Visual State**: Button shows "Dev✓" and changes to primary color
5. **Long Press**: Reset dev mode and return to login screen

## Dev Mode User

The fake user created has these properties:

- **ID**: `dev-user-123`
- **Email**: `dev@example.com`
- **Name**: Dev User
- **Role**: user
- **Status**: Email confirmed, authenticated

## Development Only

This component only renders in development mode (`__DEV__`). It will not appear in production builds.

## Styling

- **Default**: Red background (DANGER color)
- **Active**: Blue background (PRIMARY color) with slight scale effect
- **Position**: Top-right corner, above all other content
- **Shadow**: Subtle shadow for better visibility

# 📍 Route Map for FindU (expo-router)

## Root
- `app/index.tsx` → `/`  
  _(starting entry point / home root)_  

## Auth
- `app/auth/forget-password.tsx` → `/auth/forget-password`  
- `app/auth/verify-otp/index.tsx` → `/auth/verify-otp`  

## Matches
- `app/matches/[userId].tsx` → `/matches/:userId`  
  - Example: `/matches/123`  
  - Example: `/matches/jane-doe`  

## Onboarding
- `app/onboarding/index.tsx` → `/onboarding`  
- `app/onboarding/afterInfo.tsx` → `/onboarding/afterInfo`  

## Profile Setup
- `app/profile-setup/[step].tsx` → `/profile-setup/:step`  
  - Example: `/profile-setup/1`  
  - Example: `/profile-setup/basic-info`  

---

## ✅ Usage with `DevButton`

```tsx
<DevButton route="/" />                    // index.tsx (home/root)
<DevButton route="/auth/forget-password" />
<DevButton route="/auth/verify-otp" />
<DevButton route="/matches/123" />         // dynamic param
<DevButton route="/onboarding" />
<DevButton route="/onboarding/afterInfo" />
<DevButton route="/profile-setup/1" />     // first step of setup
