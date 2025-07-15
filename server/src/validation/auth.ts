/*
  authValidation.ts Pseudo-Code Plan

  1. Import validation functions from your validation library (e.g. express-validator)

  2. Define validation rules for user registration:
     - Check if email is valid format and ends with .edu
     - Check password meets complexity requirements:
       * Minimum length
       * Contains uppercase, lowercase, number, special char
     - Confirm password matches password field

  3. Define validation rules for user login:
     - Check if email is valid format
     - Check if password is present (not empty)

  4. Define validation rules for requesting password reset:
     - Validate email is in correct format

  5. Define validation rules for resetting password:
     - Validate presence of reset token
     - Validate new password meets complexity requirements

  6. Export all validators so they can be used as middleware in your routes

  7. (Optional) Create helper functions if you want to reuse validation logic like password checks

  8. (Optional) Add custom validators if any special logic needed (e.g. confirm passwords match)

  9. (Optional) Add comments for each validator to explain what it does

  10. Test your validators to make sure they catch invalid input and allow valid input
*/