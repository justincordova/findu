/*
  authService.ts Pseudo-Code Plan

  1. Import necessary modules and dependencies:
     - Database client or ORM for user lookup and creation
     - Password hashing library (e.g., bcrypt)
     - JWT library for token generation and verification
     - Email or notification service for sending verification/reset emails (optional)
     - Logger (optional)

  2. Define function to register a new user:
     - Receive user data (email, password, etc.)
     - Check if user with given email or username already exists
     - Hash the user’s password securely
     - Create and save new user record in the database
     - (Optional) Send verification email or welcome message
     - Return created user info (without sensitive data like password)

  3. Define function to login a user:
     - Receive email and password
     - Find user by email
     - If user not found, throw error or return failure
     - Compare given password with stored hashed password
     - If password mismatch, throw error or return failure
     - Generate access token (JWT) and possibly refresh token
     - Return tokens and user info

  4. Define function to verify JWT tokens:
     - Receive a token
     - Verify token signature and expiration
     - Return decoded token data or error if invalid/expired

  5. Define function to handle password reset requests:
     - Receive user email
     - Generate a password reset token (could be JWT or random string)
     - Save token with expiration in database or cache
     - Send password reset email with token link

  6. Define function to reset password:
     - Receive reset token and new password
     - Verify token is valid and not expired
     - Hash the new password
     - Update user’s password in the database
     - Invalidate the reset token

  7. Define function to logout user:
     - (If using refresh tokens) invalidate refresh token
     - (Optional) Clear sessions or tokens in DB or cache

  8. (Optional) Define helper functions for token creation and password hashing

  9. Export all functions so they can be used by your route handlers or controllers

  10. (Optional) Add logging at key points for monitoring/auth events

  11. Write unit tests to verify all authentication flows work correctly
*/
