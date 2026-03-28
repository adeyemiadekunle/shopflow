export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must include uppercase, lowercase, number, and special character.';

export const AUTH_THROTTLES = {
  register: { limit: 5, ttl: 60 },
  login: { limit: 5, ttl: 60 },
  refresh: { limit: 20, ttl: 60 },
  verifyEmail: { limit: 10, ttl: 600 },
  resendVerificationEmail: { limit: 3, ttl: 600 },
  forgotPassword: { limit: 3, ttl: 600 },
  resetPassword: { limit: 5, ttl: 600 },
} as const;
