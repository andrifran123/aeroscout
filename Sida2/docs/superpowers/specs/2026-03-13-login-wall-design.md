# Login Wall for Sida2 Index Page

## Summary

Add a full-block login wall to `Sida2/index.html` that prevents unauthenticated users from seeing any dashboard content. The wall contains an embedded login form (email/password + Google OAuth) styled to match the Sida2 design language. After successful login the page reloads to reveal the dashboard.

## Architecture

A single `#auth-wall` div overlays the entire page. On page load:

1. Load Supabase JS client via CDN (`@supabase/supabase-js@2`)
2. All dashboard content (`nav`, `.app-layout`, `footer`) starts hidden via CSS (`display:none`)
3. `#auth-wall` starts visible with a centered spinner/loading state
4. Call `supabaseClient.auth.getSession()` inside an async IIFE
5. **No session** -> hide spinner, show login form inside `#auth-wall`
6. **Session exists** -> hide `#auth-wall`, show `nav` + `.app-layout` + `footer`, call `load().catch(...)`

### Preventing flash of content (FOUC)

CSS sets `nav`, `.app-layout`, and `footer` to `display:none` by default. JS reveals them only after confirming a valid session. This ensures unauthenticated users never see dashboard content, even briefly.

### Handling `load()`

The existing standalone `load().catch(...)` call at line 493 must be removed. Instead, `load()` is called conditionally inside the auth check — only when a session exists. The `.catch()` error handler must be preserved so API failures still display an error in `#kpi`. The `load()` function definition itself is not modified.

### Auth code structure

The auth initialization code is wrapped in an **async IIFE** `(async function(){ ... })()` placed after the theme init block. The existing `<script>` block is not async, so an IIFE is required to use `await getSession()`. Theme init (lines 223-228) runs first (synchronously), then the auth IIFE runs. The `#auth-wall` correctly picks up the active theme via CSS variables.

## Login Wall UI

Centered card using existing Sida2 design tokens:

- **Background**: `var(--bg)` (supports dark mode)
- **Card**: `var(--wh)` bg, `var(--bd)` border, `border-radius: 11px`, `var(--sh)` shadow (same as `.c` cards)
- **Fonts**: Barlow for form elements, Newsreader for heading
- **Card contents** (top to bottom):
  - "AEROSCOUT" logo text (matching nav `.logo` styling)
  - Heading: "Aviation Intelligence" in Newsreader italic
  - Subtitle: "Sign in to access the dashboard" in `var(--sec)` color
  - Alert box (hidden by default, shows errors/success)
  - Email input field
  - Password input field
  - "Sign In" button (full width, `var(--pr)` blue)
  - Divider with "or" text
  - "Continue with Google" button (outline style with Google SVG icon)
  - "Don't have an account? Sign Up" link -> `signup.html` (relative path, same as login.html)
  - Footer: Terms | Privacy links
- **Dark mode**: Works automatically via existing CSS variables
- **Responsive**: Card `max-width: 420px`, padding reduces on mobile
- **Loading state**: While `getSession()` resolves, show a small spinner centered on the page. Replaces with the login form or reveals the dashboard.
- **"Forgot Password"**: Intentionally omitted (not present in login.html either)

## Auth Flow

- **Supabase config**: Copy credentials from login.html (lines 208-209)
  - `SUPABASE_URL`: `https://ziboktbmbyjbhifsdypa.supabase.co`
  - `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYm9rdGJtYnlqYmhpZnNkeXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjMwODUsImV4cCI6MjA4MjMzOTA4NX0.eayvAsTuezEJZ-SIvEjZmrYaUxmJtntV8pK8fyUBnbY`
  - Loaded via `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` — placed at the end of `<head>`, after the echarts script tag
- **Email/password login**: `supabaseClient.auth.signInWithPassword({ email, password })`
  - On success: show success message, then `window.location.reload()`
  - On error: show error in alert box, re-enable button
- **Google OAuth**: `supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } })`
  - Uses `origin + pathname` (not `href`) to avoid including stale hash fragments in the redirect URL
  - Intentionally different from login.html which redirects to Jobs.html — this redirects back to the dashboard
- **OAuth return handling**: Check `window.location.hash` for `access_token`
  - If present, listen for `SIGNED_IN` via `onAuthStateChange` and reload
- **Error display**: Red background alert for errors, green for success (matching login.html pattern)
- **Session expiry**: Not handled in this iteration. If a session expires mid-use, the user sees stale data until they reload. Can be added later.

## Design Note

This login form intentionally uses the Sida2 design language (Barlow/Newsreader, `var(--pr): #2563EB`, card styling) rather than login.html's styling (Inter/Outfit, `#0066FF`, hero background image). This keeps the form native to the dashboard page.

## Out of Scope

- **Logout button**: The nav currently has no logout mechanism. Adding one is a separate task.
- **Nav "Sign Up Free" for authenticated users**: The CTA remains visible after login — updating nav state for auth is a separate task.
- **CDN failure fallback**: If Supabase CDN fails to load, the spinner shows indefinitely. A timeout fallback can be added later.

## Files Modified

- `Sida2/index.html` — the only file changed:
  1. Add Supabase CDN script tag at end of `<head>` (after echarts script)
  2. Add `#auth-wall` HTML block after opening `<body>`, before `<nav>`
  3. Add auth-wall CSS in existing `<style>` block (including `nav, .app-layout, footer { display: none }` default)
  4. Add auth initialization JS as async IIFE after theme init block, before tab/chart code
  5. Remove the standalone `load().catch(...)` call — replaced by conditional call inside auth IIFE (preserving the `.catch()` error handler)

## What Does NOT Change

- All existing dashboard HTML structure
- All existing CSS (except adding new rules)
- All chart rendering / data loading functions
- The `load()` function definition
- Theme toggle functionality
- Sidebar, mobile tabs, responsive behavior
