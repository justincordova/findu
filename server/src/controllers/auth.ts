/*
  authController.ts Pseudo-Code Plan

  1. Import express types: Request, Response, NextFunction
  2. Import authService with authentication functions

  3. Define controller function for user registration (registerUser):
     - Extract user input from req.body (email, password, etc.)
     - Call authService.registerUser with input data
     - On success, send back created user info (excluding sensitive data)
     - On failure, catch error and call next(error)

  4. Define controller function for user login (loginUser):
     - Extract email and password from req.body
     - Call authService.loginUser with email/password
     - On success, send back access token and user info
     - On failure, catch error and call next(error)

  5. Define controller function for token verification or session check (verifyToken):
     - Extract token from headers or cookies
     - Call authService.verifyToken
     - Send back decoded token data or error

  6. Define controller function for password reset request (requestPasswordReset):
     - Extract email from req.body
     - Call authService.requestPasswordReset
     - Send success response (e.g. "Password reset email sent")
     - Handle errors

  7. Define controller function for resetting password (resetPassword):
     - Extract reset token and new password from req.body
     - Call authService.resetPassword
     - Send success confirmation
     - Handle errors

  8. Define controller function for logout (logoutUser):
     - (If refresh tokens) Invalidate token using authService
     - Send confirmation response

  9. Export all controller functions for use in routing

  10. Optionally, add input validation middleware before these controllers (using validators)

  11. Use try-catch blocks or async error handling middleware to pass errors downstream
*/
