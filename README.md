# Inbox.GOP for iPhone

Native iPhone client for Inbox.GOP, built with Expo and React Native. It uses the dedicated bearer-token API at `/api/mobile/v1`; it does not reuse the website’s cookie session.

## First release

- Existing-account login and web password-reset handoff
- Rotating mobile session with the refresh token stored in iOS secure storage
- Automatic single-flight token refresh and forced-session handling
- Cursor-paginated email/SMS feed with search and filters
- Message detail with inbox placement and safe external CTA links
- Followed entities with follow-limit error handling
- Campaign alert creation, listing, and deletion
- Profile, organization/plan context, and logout
- Offline and recoverable error states
- Light and dark appearance, safe-area layout, and 44pt-or-larger controls

## Local development

Requirements: Node.js 24, pnpm 11.19.0, the full Xcode app, and an iPhone Simulator.

```bash
pnpm install
cp .env.example .env.local
pnpm ios
```

Set `EXPO_PUBLIC_API_BASE_URL` in `.env.local` to an approved non-production deployment for development. The value is a public API origin, never a database URL or secret. If the path is omitted, the app appends `/api/mobile/v1`.

If `EXPO_PUBLIC_API_BASE_URL` is not set, release builds use:

```text
https://app.rip-tool.com/api/mobile/v1
```

Do not put `MOBILE_JWT_SECRET`, `DATABASE_URL`, passwords, refresh tokens, or Vercel bypass credentials in this repository or in an `EXPO_PUBLIC_*` variable. Everything prefixed `EXPO_PUBLIC_` is included in the client application.

## Verification

```bash
pnpm run check
pnpm exec expo-doctor
pnpm run export:ios
```

The pure unit tests cover feed query serialization, safe CTA-link handling, and plain-text conversion. Authentication and API behavior are additionally verified by the server repository’s mobile integration suite.

## TestFlight and App Store setup

The app can be developed and run in the Simulator before Apple Developer enrollment finishes. A simulator-only EAS build also does not require Apple signing. Once the account is active:

1. Confirm that the bundle identifier `com.inboxgop.app` is available and belongs to the correct Apple team.
2. Create or sign in to an Expo account.
3. Run `pnpm dlx eas-cli@latest login`.
4. Run `pnpm dlx eas-cli@latest build:configure` and accept the existing iOS profiles in `eas.json`.
5. Optionally create a simulator build with `pnpm dlx eas-cli@latest build --platform ios --profile simulator`.
6. Create a physical-device development build with `pnpm dlx eas-cli@latest build --platform ios --profile development`.
7. Create the TestFlight build with `pnpm dlx eas-cli@latest build --platform ios --profile production`.
8. Submit it with `pnpm dlx eas-cli@latest submit --platform ios`.

Do not submit to App Review until the screenshots, privacy disclosures, support URL, demo-account instructions, and production acceptance tests are complete.

This first release deliberately supports **existing accounts only** and does not link to web account creation. If account creation is added to the app later, Apple requires users to be able to initiate full account deletion from the app as well.

## Intentional first-release boundaries

- Campaign alerts are managed in-app, but push notifications are not enabled yet.
- Password resets open the secure website flow.
- Email HTML is converted to readable plain text rather than executed in a WebView.
- The app is configured for iPhone only (`supportsTablet: false`).
