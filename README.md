# MindfulMunch

A fast, judgment-free way to notice when and why you snack — no calories, no streaks, no guilt.

**Live app:** https://mindfulmunch.vercel.app

## Philosophy

- The reason tag (why someone snacked) is the actual product — the food description is just the entry point.
- Visual style is deliberately calm and neutral, modeled loosely on Apple Screen Time's stacked hourly/weekly bar charts — never alarming, never implying more snacks = worse.

This is a solo lifestyle-business project, not a startup — the codebase favors simple and maintainable over clever.

## Platforms

The **web app is the primary platform**, deployed on Vercel. It isn't headed for the App Store; the iPhone build exists mainly for exporting history from earlier installs.

| | Web (primary) | iPhone build |
| --- | --- | --- |
| Storage | Supabase when signed in, browser storage when signed out | On-device only |
| Google sign-in and sync | Yes | No |
| Import data | Yes | No |
| Export data | Downloads a JSON file | Share sheet |
| Weekly insight notification | No (`expo-notifications` is iOS/Android only) | Yes |
| Time picker | Browser date-time input | iOS spinner |

Web-only code lives in `.web.ts`/`.web.tsx` files next to their native counterparts; Metro picks the right one per platform.

## Tech stack

- [Expo](https://expo.dev) SDK 57 + React Native + TypeScript, with `react-native-web` for the web build
- [React Navigation](https://reactnavigation.org) (native-stack), with URL linking on web
- [Supabase](https://supabase.com) — Google sign-in and the `snacks` table (web only)
- `@react-native-async-storage/async-storage` — local storage (localStorage on web)
- `react-native-svg` — the stacked bar charts
- `@react-native-community/datetimepicker` — the iOS time picker
- `expo-notifications`, `expo-file-system`, `expo-sharing` — iPhone notification and export
- [Vercel](https://vercel.com) — web hosting

## Project structure

```
App.tsx                            Root navigator, theming, web URL linking, notification wiring
public/                            Web index.html template, manifest, home-screen icons
supabase/schema.sql                snacks table + row-level security policies
src/
  types/snack.ts                   Snack type + the 7 reason tags
  theme/colors.tsx                 Light/dark palettes, ThemeProvider, useTheme()
  theme/layout.ts                  Web app width cap + per-platform top padding
  lib/
    supabase.ts / .web.ts          Supabase client (null on native, real client on web)
    auth.ts                        Google sign-in/out + useSession()
    notify.ts                      Alerts that also work in the browser
  storage/
    snackStorage.ts                CRUD (cloud when signed in, local otherwise) + day/week helpers
    exportSnacks.ts / .web.ts      Share sheet on native, file download on web
    importSnacks.ts / .web.ts      Import an exported JSON file (web only)
  notifications/
    weeklyInsight.ts / .web.ts     Weekly insight computation + scheduling (no-op on web)
  components/
    StackedBarChart.tsx            Reusable SVG bar chart (hourly or daily buckets)
    SegmentedControl.tsx           Today/Week and theme toggles
    ReasonLegend.tsx               Color key for the reason tags
    SnackForm.tsx                  Shared text/reason/time form (Log + Edit)
    DateTimePicker.tsx / .web.tsx  iOS spinner on native, datetime-local input on web
  screens/
    OnboardingScreen.tsx           2-slide intro (swipeable, with a sign-in link on web)
    LogScreen.tsx                  Fast snack entry (quick-select, reason, time)
    TodayScreen.tsx                Combined Today/Week view, charts, log list
    EditSnackScreen.tsx            Edit or delete a logged snack
    SettingsScreen.tsx             Account, appearance, export/import, replay onboarding
```

## Getting started

```bash
npm install
npx expo start
```

Press `w` to open the web app in a browser. Press `i` for the iOS Simulator, or scan the QR code with Expo Go on a physical device.

### Type-checking

```bash
npx tsc --noEmit
```

There's no test suite in the repo — type-checking plus trying the change in a browser is the safety net before shipping.

## Deploying the web app

```bash
npx vercel deploy --prod
```

This builds with `expo export -p web` on Vercel (see `vercel.json`) and publishes to https://mindfulmunch.vercel.app. `vercel.json` rewrites every path to the app so URLs like `/log` survive a reload; `.vercelignore` keeps the native `ios/` and `android/` folders out of the upload. Pushing to GitHub doesn't deploy on its own unless the repo is connected with `vercel git connect`.

To check a production build locally, `npx expo export -p web` then serve `dist/` with a single-page-app fallback (for example `npx serve -s dist`); `npx expo serve` doesn't fall back, so it 404s on deep links like `/log`.

### Web addresses

| Path | Screen |
| --- | --- |
| `/` | Log a snack |
| `/log` | Today/Week view |
| `/edit/<snack id>` | Edit a snack |
| `/settings` | Settings |
| `/welcome` | Onboarding |

The browser's back button and back-swipe move between screens. Linking is web-only and only turns on once onboarding is done.

### Installing on a phone's home screen

In Safari, tap **Share → Add to Home Screen**. It opens full-screen with its own icon, and isn't subject to Safari's 7-day wipe of site storage. iOS keeps a home-screen app's storage separate from Safari's, so sign in once inside it.

## Accounts, sync, and data

- **Signed out:** snacks are saved only in that browser (localStorage).
- **Signed in with Google:** snacks are saved in Supabase, so every browser where you sign in sees the same log. The first time you sign in on a browser, anything saved locally there is uploaded to your account automatically.
- **Privacy:** the `snacks` table has row-level security; each user can only read and write their own rows, and signed-out visitors see nothing. The Supabase URL and publishable key in `src/lib/supabase.web.ts` are meant to be public.
- **Offline:** saving needs a connection. If a save fails, the form keeps what you typed and shows an error. If loading fails, the app shows the last snacks it fetched.
- **Export/import:** Settings → Export data saves a JSON file. Settings → Import data (web) reads that file back in. Importing the same file twice won't create duplicates, because snacks keep their IDs.

### Supabase setup

The project is `douoivwmpytvuzoccpmi`. To recreate it, run `supabase/schema.sql` in the Supabase SQL Editor and configure:

- **Authentication → Sign In / Providers → Google:** a Google Cloud OAuth client of type "Web application" whose authorized redirect URI is the callback URL shown on that page. The Google OAuth app is in Testing mode, so only accounts added as test users can sign in.
- **Authentication → URL Configuration:** Site URL `https://mindfulmunch.vercel.app`; redirect URLs `https://mindfulmunch.vercel.app/**` and `http://localhost:8081/**`.

## Running the iPhone build

The iPhone build needs Xcode on a Mac, with a free Apple ID signed in under Xcode → Settings → Accounts. Free signing only lasts about 7 days, after which the app needs reinstalling (its data survives a reinstall; deleting the app wipes it).

```bash
EXPO_USE_PRECOMPILED_MODULES=0 npx expo run:ios --device <device UDID> --configuration Release
```

- `EXPO_USE_PRECOMPILED_MODULES=0` builds Expo's native modules from source. Expo's prebuilt frameworks are compiled with an older Swift than Xcode 27.1, and fail to build without it.
- `--configuration Release` embeds the JavaScript bundle, so the app runs without the dev server.
- If the build fails with `No profiles for 'com.elijahdr.mindfulmunch' were found`, the signing profile expired. Run `xcodebuild` from `ios/` with `-allowProvisioningUpdates` to regenerate it, then install the built app with `xcrun devicectl device install app`.
- After a re-sign, iOS may refuse to open the app until you trust the developer under Settings → General → VPN & Device Management.

### Weekly insight notification (iPhone only)

Once a week, the app sends one local notification with a single rotating insight about your snacking — never a volume comparison ("you snacked more/less than last week"), since that framing implies a verdict.

- **When:** every Sunday at 6:00 PM, device local time. A local notification can't regenerate its own text between firings, so the app reschedules a fresh one for the upcoming Sunday every time it's opened.
- **What it says:** rotates through three insight types — most common reason tag, most common time of day, and the "steadiest" day (closest to the week's average). If the type up next has no data, it falls back to the next; if nothing was logged that week, no notification is sent.
- **On tap:** opens straight into the Week view.

## Known limitations and ideas

- **The iPhone build has no sign-in.** Its snacks stay on the phone; move them to an account with Export on the phone and Import on the web.
- **Week start day is hardcoded to Sunday.** `getCurrentWeekStart()` in `src/storage/snackStorage.ts` has a `TODO` to auto-detect it from the device's locale.
- **Google's sign-in screen shows the Supabase project address** ("continue to douoivwmpytvuzoccpmi.supabase.co"). Showing a custom name needs Supabase's paid custom-domain add-on.
- **Google sign-in from a home-screen install on iPhone is untested.** iOS can hand the sign-in redirect back to Safari instead of the home-screen app.
- **The app icon is a simple placeholder** (three bars in the tag colors), used for the web icons and favicon. The iPhone build still uses Expo's default icon in `assets/icon.png`.
