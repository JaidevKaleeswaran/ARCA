---
description: Guardrails for user authentication interfaces and onboarding tutorial discoverability
trigger: always_on
---

# Authentication & Onboarding UX Guidelines

## 1. Password Input Fields
- Always include a password visibility toggle button (e.g., `Eye` / `EyeOff` icons from `lucide-react`) allowing users to see and verify characters while typing.
- Always provide sufficient right padding (`pr-10` or `pr-11`) so toggles never overlap entered text.

## 2. Password Reset & Firebase Error Handling
- Every email/password authentication interface must provide a visible "Forgot password?" trigger.
- Implement self-service password reset flows using `sendPasswordResetEmail` with safe fallback for domain continue URIs.
- Explicitly map modern Firebase v10/v11 error codes (`auth/invalid-credential`, `auth/user-not-found`, `auth/wrong-password`) to actionable user-friendly messages rather than exposing raw SDK codes.
- When email activation is required, do not abruptly log the user out; route them to an informative activation screen with clear spam folder advice and resend controls, with an option to defer verification so they are never locked out of their dashboard.

## 3. Onboarding & Tutorial Discoverability
- Never conceal tutorial or help triggers behind small, unlabeled icons in non-sticky headers.
- Always provide an explicit label (e.g., "Tutorial ?") with high-contrast accent styling.
- Ensure the tutorial trigger remains accessible regardless of scroll depth (e.g., via sticky navigation or a floating quick-access button).
- On login screens, provide an unblocked path to enter Guest mode and launch the tutorial immediately.
