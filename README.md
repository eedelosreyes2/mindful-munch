# MindfulMunch

A fast, judgment-free way to notice when and why you snack — no calories, no streaks, no guilt.

## Philosophy

- No calorie counting, no portion sizes, no nutrition data at all.
- No goals, streaks, "good/bad" framing, or red/green states — ever.
- No exercise-equivalent or "burn this off" messaging.
- The reason tag (why someone snacked) is the actual product — the food description is just the entry point.
- Visual style is deliberately calm and neutral, modeled loosely on Apple Screen Time's stacked hourly/weekly bar charts — never alarming, never implying more snacks = worse.

This is a solo lifestyle-business project, not a startup — the codebase favors simple and maintainable over clever.

## Tech stack

- [Expo](https://expo.dev) SDK 57 + React Native + TypeScript
- [React Navigation](https://reactnavigation.org) (native-stack)
- `@react-native-async-storage/async-storage` — all data storage, entirely on-device (see [Data & storage](#data--storage))
- `react-native-svg` — the stacked bar charts
- `@react-native-community/datetimepicker` — the custom "log at an earlier time" picker
- `expo-notifications` — the weekly insight notification

## Project structure

```
App.tsx                          Root navigator, theming, notification wiring
src/
  types/snack.ts                 Snack type + the 5 reason tags
  theme/colors.ts                Light/dark theme palettes + useTheme() hook
  storage/snackStorage.ts        AsyncStorage CRUD + day/week aggregation helpers
  notifications/weeklyInsight.ts Weekly insight computation + scheduling
  components/
    StackedBarChart.tsx          Reusable SVG bar chart (hourly or daily buckets)
    SegmentedControl.tsx         Today/Week toggle
    ReasonLegend.tsx             Color key for the 5 reason tags
    SnackForm.tsx                Shared text/reason/time form (used by Log + Edit)
  screens/
    OnboardingScreen.tsx         2-screen intro, shown once
    LogScreen.tsx                Fast snack entry (quick-select, reason, time)
    TodayScreen.tsx              Combined Today/Week view, charts, log list
    EditSnackScreen.tsx          Edit or delete a logged snack
```

## Getting started

```bash
npm install
npx expo start
```

This runs the Metro dev server. Press `i` for the iOS Simulator, `a` for an Android emulator, or scan the QR code with Expo Go on a physical device.

**Note:** `@react-native-community/datetimepicker` and `expo-notifications` are native modules with config plugins — a plain Expo Go install may not reflect every native behavior (notification permissions, the iOS picker's dark-mode `themeVariant`, etc.) exactly as a real build would.

### Running on your own iPhone (no Expo Go)

Standalone installs need native code, so this project must be built rather than just loaded into Expo Go:

```bash
npx expo run:ios --device
```

This requires Xcode installed on a Mac, with a free Apple ID signed in under Xcode → Settings → Accounts (no paid Apple Developer Program needed for this). The tradeoff of the free option: iOS only trusts the app for about 7 days, after which it needs to be reinstalled by reconnecting the phone and re-running the command above. A paid Apple Developer Program membership ($99/year) removes that limitation and is also what's needed to eventually publish to the App Store.

### Type-checking

```bash
npx tsc --noEmit
```

There's no test suite yet — this is the main safety net before shipping a change.

## Data & storage

Everything is local-first: all snack entries live only in `AsyncStorage` on the device the app is installed on (see `src/storage/snackStorage.ts`). There is no backend, no account system, and no remote database of any kind — nothing to set up, and nothing syncs between devices. This also means uninstalling the app or losing the device permanently loses the data; there's currently no export/backup feature (see [Known limitations](#known-limitations-and-ideas)).

## Dark mode

The app follows the device's system light/dark appearance automatically (`useColorScheme()` in `src/theme/colors.ts`) — there is no in-app manual override toggle. Changing it means changing the phone's own system appearance setting (Settings → Display & Brightness, or Control Center).

## Weekly insight notification

Once a week, the app sends one local notification with a single rotating insight about your snacking — never a volume comparison ("you snacked more/less than last week"), since that framing implies a verdict.

- **When:** every Sunday at 6:00 PM, device local time. Since a local notification can't regenerate its own text between firings, the app recomputes and reschedules a fresh one-off notification for the upcoming Sunday every time it's opened, so the content reflects your most recent data as of your last visit.
- **What it says:** rotates deterministically (not randomly) through three insight types, one per week:
  1. Most common reason tag that week (e.g. "Stressed was your most common reason for snacking this week.")
  2. Most common time of day — morning / afternoon / evening / night
  3. "Steadiest" day — the day whose snack count was closest to the week's average
  
  If the type up next has no data to report, it falls back to the next type; if there's truly nothing logged that week, no notification is sent.
- **On tap:** opens the app directly into the Today screen with Week view selected, so you land on the chart the notification was referencing.

This hasn't been verified on a physical device yet (permission prompts, delivery timing, and the cold-start deep link all need real-device testing).

## Known limitations and ideas

- **No data export/backup.** Since storage is local-only, there's no way to recover snack history if the app is uninstalled or the device is lost. A simple share-sheet text export would close this gap without needing a backend.
- **Week start day is hardcoded to Sunday.** `getCurrentWeekStart()` in `src/storage/snackStorage.ts` has a `TODO` to instead auto-detect this from the device's locale/regional settings.
- **No settings screen.** There isn't one yet, and none of the current features need one on their own — if a second real preference comes up (e.g. a manual dark-mode override, or a configurable week start), that'd be the natural point to add one.
