# Decisions

Meaningful design decisions for MindfulMunch, oldest first. Quoted reasons come from the repo or from Elijah directly. The earliest entries were reconstructed from the code and git history on 2026-10-19, and Elijah approved the reconstructed reasons.

## 2026-09-20 — Build with Expo (managed workflow) + React Native + TypeScript
- **Alternatives:** Native Swift/SwiftUI; Flutter; a web app/PWA from day one.
- **Why:** One TypeScript codebase that runs on iOS with minimal native setup, and could reach other platforms later, fitting the README's "simple and maintainable over clever" stance for a solo project.
- **Source:** 63ebd08 (`package.json`, `app.json`)

## 2026-09-20 — Navigate with React Navigation's native stack, not Expo Router
- **Alternatives:** Expo Router (file-based routing); a tab-based layout with React Navigation's bottom tabs.
- **Why:** The app has a small, fixed set of screens that flow from one main Log screen, which a single stack handles without file-based routing.
- **Source:** 63ebd08 (`package.json`, `App.tsx`)

## 2026-09-20 — Make the reason tag the core data model, with no nutrition data
- **Alternatives:** Calorie/macro tracking (MyFitnessPal style); free-text mood journaling.
- **Why:** "The reason tag (why someone snacked) is the actual product — the food description is just the entry point." The app's description is "no calories, no streaks, no guilt."
- **Source:** 63ebd08 (`src/types/snack.ts`, `app.json`); `README.md`. The tag set later grew from 5 to 7 (Habit in 2aced7d, Craving in c1f2b8f).

## 2026-09-20 — Store everything locally in AsyncStorage, with no backend
- **Alternatives:** SQLite (`expo-sqlite`); a hosted backend from the start (Firebase, Supabase).
- **Why:** "There is no backend, no account system, and no remote database of any kind — nothing to set up." Partly superseded by the Supabase sync decision on 2026-10-19.
- **Source:** 63ebd08 (`src/storage/snackStorage.ts`); `README.md` at 61d469a

## 2026-09-20 — Hand-build the charts and swipe carousel (react-native-svg + PanResponder)
- **Alternatives:** A chart library (Victory Native, react-native-gifted-charts); a carousel or pager library (react-native-pager-view, react-native-reanimated-carousel).
- **Why:** Full control over the calm, Screen Time-style stacked bars, which are simple to draw directly, and no extra native dependencies.
- **Source:** 63ebd08 (`src/components/StackedBarChart.tsx`); b8457b2 (swipe carousel in `src/screens/TodayScreen.tsx`)

## 2026-09-22 — Rely on type-checking and manual testing instead of an automated test suite
- **Alternatives:** Jest + React Native Testing Library; end-to-end tests with Playwright (web) or Detox/Maestro (iOS).
- **Why:** Faster iteration for a solo project, where "type-checking plus trying the change in a browser is the safety net" before shipping.
- **Source:** 61d469a (`README.md`, which first described type-checking as "the main safety net")

## 2026-09-22 — Send the weekly insight as a one-off local notification, rescheduled on every launch
- **Alternatives:** A repeating weekly local trigger; a server-sent push notification.
- **Why:** "Local notifications can't regenerate their own content between firings, so this is meant to be called on every app launch." Insights rotate and are never volume comparisons, "since that framing implies a verdict."
- **Source:** 61d469a (`src/notifications/weeklyInsight.ts`, `README.md`)

## 2026-09-22 — Sign the iPhone build with a free Apple ID, and drop the Push Notifications entitlement
- **Alternatives:** The Apple Developer Program ($99/year) with TestFlight; EAS Build.
- **Why:** The `expo-notifications` config plugin was dropped because "it adds a Push Notifications entitlement that free Apple ID accounts can't sign, and we only use local (non-push) notifications." Free signing itself was chosen to avoid the yearly fee while the app was personal-use only, accepting the 7-day reinstall.
- **Source:** 7812dfd (`app.json`)

## 2026-09-22 — Theme through a ThemeProvider context with a persisted System/Light/Dark preference
- **Alternatives:** Follow the system appearance only (the first version, b207e79); a styling library with theming (NativeWind, Tamagui).
- **Why:** "Restructure theming around a ThemeProvider/context so the manual override can persist and apply reactively across every screen."
- **Source:** 0e9c441 (`src/theme/colors.tsx`)

## 2026-09-22 — Nudge toward tagging a reason instead of requiring one
- **Alternatives:** Make the reason tag required; no prompt at all.
- **Why:** "I forget to actually use tags, and a main point of this app is to get insight to why I snacked." So untagged snacks get a prompt that visually favors "Add a reason". A prompt rather than a hard requirement keeps logging fast, and avoids the judgment the app is built to avoid.
- **Source:** 2aced7d (`src/components/SnackForm.tsx`); Elijah, in discussion (2026-09-22)

## 2026-10-19 — Make the web the primary platform: react-native-web, a static export on Vercel, and `.web.ts` platform files
- **Alternatives:** Stay iOS-only and pay for TestFlight distribution; a separate web app (for example Next.js); other static hosts (EAS Hosting, Netlify).
- **Why:** "I am not planning on launching to app store, which is why I wanted web now — I am tired of reinstalling manually every week." The free-signed iPhone build expires every 7 days, and react-native-web reuses the existing code.
- **Source:** 2536abf (`vercel.json`, `*.web.ts` files); `README.md` at 4927f30; Elijah, in discussion (2026-10-19)

## 2026-10-19 — Sync through Supabase with row-level security; cloud when signed in, local when signed out, web only
- **Alternatives:** Firebase (Auth + Firestore); a custom API with Postgres; iCloud/CloudKit.
- **Why:** Supabase over Firebase for its Postgres data model, built-in auth and a free tier. Row-level security is there "so each user only sees their own", and locally saved snacks are "uploaded on first sign-in" so nothing is lost. "The iPhone build stays local-only", which avoids native OAuth redirect setup for an app that's being retired.
- **Source:** 1f6fb3e (`src/storage/snackStorage.ts`, `src/lib/supabase.ts`, `src/lib/supabase.web.ts`, `supabase/schema.sql`)

## 2026-10-19 — Use Google as the only sign-in method
- **Alternatives:** Email one-time codes; Sign in with Apple; email magic links.
- **Why:** One-tap sign-in on the web with little setup. Apple's rule requiring Sign in with Apple alongside Google doesn't apply, because the app isn't going to the App Store.
- **Source:** 1f6fb3e (`src/lib/auth.ts`)

## 2026-10-19 — Move iPhone history by exporting and importing a file, not by adding sign-in to the iPhone build
- **Alternatives:** Native Google sign-in in the iPhone build (for example via `expo-auth-session`) that uploads automatically.
- **Why:** Import exists "so history from the iPhone app can be moved into an account." It's a one-time migration, so building native sign-in for an app being retired wasn't worth it.
- **Source:** 1f6fb3e (`src/storage/importSnacks.web.ts`)

## 2026-10-19 — Make the web app installable to the home screen
- **Alternatives:** Browser-tab use only; wrapping the web app natively (Capacitor).
- **Why:** A home-screen install "opens full-screen with its own icon, and isn't subject to Safari's 7-day wipe of site storage." iOS only allows web push for home-screen installs.
- **Source:** 4927f30 (`public/manifest.json`, `public/index.html`); `README.md`

## 2026-10-19 — Send the web weekly insight as Web Push from an hourly Supabase Edge Function
- **Alternatives:** A weekly email digest; Firebase Cloud Messaging or OneSignal; client-side notifications, which only fire while the app is open.
- **Why:** Moving to the web dropped the iPhone's local notification ("So I'll no longer get the weekly notifications?"), and this brings it back. The job runs hourly so each browser gets its insight "when it's 6:00 PM Sunday in that browser's saved time zone, using the week that just ended". The insight wording is shared with the iPhone build so both say the same thing. Push over an email digest keeps the same on-phone experience, with no email provider or third-party push service.
- **Source:** bfd6a7f (`supabase/functions/weekly-insight/index.ts`, `supabase/functions/_shared/insights.ts`, `supabase/weekly-insight-cron.sql`, `public/sw.js`); Elijah, in discussion (2026-10-19)

## 2026-10-19 — Keep hidden Recent suggestions and the theme preference per-device
- **Alternatives:** A Supabase table so dismissed suggestions (and the theme) follow the account.
- **Why:** It's a small convenience that doesn't justify another table and set of privacy policies. Snacks, the data that matters, already sync.
- **Source:** `src/storage/snackStorage.ts` (`hiddenQuickSelect:v1`), `src/theme/colors.tsx`; left as-is on Elijah's go-ahead

## 2026-10-19 — Keep Sunday as the hardcoded week start, in both the app and the Edge Function
- **Alternatives:** A week-start setting saved to the account and read by both; auto-detecting it from the device locale, which the server could only use if each device reported its locale when subscribing.
- **Why:** Both copies agree, so behavior is consistent, and neither alternative is needed for a Sunday-start user. Revisit if someone wants a Monday start.
- **Source:** `getCurrentWeekStart()` in `src/storage/snackStorage.ts` (TODO), `supabase/functions/weekly-insight/index.ts`; left as-is on Elijah's go-ahead

## Inconsistencies and loose ends

Resolved:

- **Accidental nested repo.** The initial commit (63ebd08) tracked a `mindful-munch` submodule pointer with no `.gitmodules`: a leftover clone of this repo's GitHub "Initial commit". It's no longer tracked.
- **Two weekly insights with different weeks.** The iPhone notification now describes the Sunday–Saturday week that ends when it fires, and opens that week, matching the web push.
- **Mismatched icons.** The iPhone build now uses the same three-bar icon as the web.
