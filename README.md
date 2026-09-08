# Inbox.GOP for iPhone

Native iPhone client for Inbox.GOP, built with Expo and React Native. It uses the dedicated bearer-token API at `/api/mobile/v1`; it does not reuse the website’s cookie session.

## First release

- Existing-account login and web password-reset handoff
- Rotating mobile session with the refresh token stored in iOS secure storage
- Automatic single-flight token refresh and forced-session handling
- Plan-aware, cursor-paginated email/SMS feed: Starter accounts receive the
  latest three hours without search or filters; paid plans receive their
  server-configured history, filter, and follow capabilities
- Message detail with a sandboxed visual email preview, native SMS presentation,
  safe external CTA links, and the iPhone share sheet
- Followed entities with follow-limit error handling
- Paid-plan CI alert creation, listing, deletion, and real-time iPhone push notifications
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

Deploy the entitlement-aware mobile API before distributing this app revision.
Older app builds ignore the new capability fields, while this build deliberately
falls back to Starter restrictions if a server does not provide them.

Do not put `MOBILE_JWT_SECRET`, `DATABASE_URL`, passwords, refresh tokens, or Vercel bypass credentials in this repository or in an `EXPO_PUBLIC_*` variable. Everything prefixed `EXPO_PUBLIC_` is included in the client application.

## Verification

```bash
pnpm run check
pnpm exec expo-doctor
pnpm run export:ios
```

The pure unit tests cover feed query serialization, fail-closed entitlement
handling, follow limits, safe CTA-link handling, and plain-text conversion.
Authentication and API behavior are additionally verified by the server
repository’s mobile integration suite.

## TestFlight and App Store setup

The app can be developed and run in the Simulator before Apple Developer enrollment finishes. A simulator-only EAS build also does not require Apple signing. Once the account is active:

1. Confirm that the bundle identifier `com.rip-tool.app` belongs to the correct Apple team and matches the existing Inbox.GOP App Store Connect record.
2. Create or sign in to an Expo account.
3. Run `pnpm dlx eas-cli@latest login`.
4. Run `pnpm dlx eas-cli@latest build:configure` and accept the existing iOS profiles in `eas.json`.
5. Optionally create a simulator build with `pnpm dlx eas-cli@latest build --platform ios --profile simulator`.
6. Create a physical-device development build with `pnpm dlx eas-cli@latest build --platform ios --profile development`.
7. Create the TestFlight build with `pnpm dlx eas-cli@latest build --platform ios --profile production`. When EAS asks, allow it to create or reuse the Apple Push Notifications key for this bundle identifier.
8. Submit it with `pnpm dlx eas-cli@latest submit --platform ios`.

Do not submit to App Review until the screenshots, privacy disclosures, support URL, demo-account instructions, and production acceptance tests are complete.

This first release deliberately supports **existing accounts only** and does not link to web account creation. If account creation is added to the app later, Apple requires users to be able to initiate full account deletion from the app as well.

## Intentional first-release boundaries

- Remote push notifications require a physical iPhone and a newly compiled EAS/TestFlight build; the Simulator cannot validate delivery.
- Password resets open the secure website flow.
- Email HTML is sanitized and rendered inside an isolated shadow document in Expo's
  DOM web view. Scripts, forms, embedded frames, and navigation are removed; links
  are exposed separately through the validated native CTA list.
- The app is configured for iPhone only (`supportsTablet: false`).
