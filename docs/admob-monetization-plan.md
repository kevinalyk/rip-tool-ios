# Inbox.GOP AdMob Monetization Plan

**Status:** Planning only — no ads or AdMob SDK are currently included in the app

**Last reviewed:** September 21, 2026

**Applies to:** Inbox.GOP iPhone app (`com.rip-tool.app`)

## Decision

Use Google AdMob to monetize **free-plan users only**. Paid-plan users must receive a completely ad-free experience.

The initial implementation should be deliberately conservative:

- one clearly labeled native ad inside the Competitive Intelligence feed;
- no app-open, interstitial, rewarded, or full-screen ads;
- no ads on login, signup, message previews, Following, Directory, Profile, or What's New;
- no political-interest or behavioral targeting;
- no ad request at all for a paid or unknown entitlement state.

This keeps the first release easy to understand, minimizes App Store review and privacy risk, and gives us real data before we add more inventory.

## Important timing clarification

We **can begin AdMob setup before Inbox.GOP is publicly available in the App Store**.

In AdMob, add Inbox.GOP as an **unpublished iOS app**. That allows us to create the app record, generate ad units, integrate the SDK, and use test ads. After the public App Store listing exists, we must return to AdMob, link that listing, configure `app-ads.txt`, and complete Google's app-readiness review before expecting normal ad serving.

Google also requires payment information before the account is eligible for monetization. The AdMob payee should be the legal person or company that should receive the revenue. If Campaign Portal LLC will own this business line, use its legal and banking details rather than treating this as an informal personal account.

## Current AdMob setup

Created September 21, 2026 under `admin@rip-tool.com`:

| Item | Status |
| --- | --- |
| AdMob account | Created; Google account verification pending |
| Payment profile | Complete through the existing AdSense relationship |
| App | Inbox.GOP, iOS, unpublished |
| iOS bundle identifier | `com.rip-tool.app` |
| AdMob app ID | `ca-app-pub-5715074898343065~8736741656` |
| Native ad unit | Inbox.GOP Free CI Feed |
| Native ad-unit ID | `ca-app-pub-5715074898343065/9125035721` |
| Partner bidding | Off |
| High-engagement ads | Off |
| App Store link | Pending public App Store availability |
| SDK/consent integration | Not started |
| Live ads | Not enabled in the app |

AdMob app and ad-unit IDs are public application configuration embedded in the shipped binary; they are not passwords or API secrets. Do not confuse them with private Google-account, payment, or signing credentials.

## Product rules

### Who sees ads

The backend should return an explicit entitlement such as:

```ts
showAds: boolean
```

Recommended behavior:

| Account state | `showAds` | Result |
| --- | ---: | --- |
| Free plan | `true` | Eligible for ads |
| Any paid plan | `false` | No ad SDK request or visible ad slot |
| Plan lookup unavailable | `false` | Fail closed; do not accidentally show a paid user an ad |
| Logged out | `false` | No ads |

The iOS app should use the server-provided entitlement, not infer access by comparing plan-name strings locally. If an account upgrades while the app is open, the ad should disappear as soon as entitlements refresh.

### Initial placement

Start with a native feed card:

- first ad after approximately 8–10 real feed messages;
- at most one ad per initial page;
- on later pages, no more often than every 12–15 real messages;
- always label it visibly as **Sponsored** or **Ad**;
- visually distinguish it from Inbox.GOP intelligence without making it disruptive;
- reserve its height while loading to prevent the feed from jumping;
- collapse the entire slot if no ad is available.

Do not put an ad above the first feed result. Do not interrupt the launch animation, Face ID, search, filtering, or opening a message.

### Targeting policy

Inbox.GOP contains political intelligence and user actions that can reveal political interests. Treat all of that as sensitive.

Do **not** use any of the following to select, personalize, or enrich ads:

- political party;
- followed entities;
- feed searches, filters, tags, or saved views;
- emails or SMS messages viewed;
- client or campaign identity;
- alert activity;
- user email address or other account data.

The recommended launch configuration is contextual/non-personalized advertising only. We should not add Apple's App Tracking Transparency prompt unless a final SDK/configuration review determines that the app actually performs cross-app tracking. Avoiding tracking is preferable for both user trust and review simplicity.

## Technical implementation plan

### 1. Create the AdMob app and test ad unit

1. Create or sign in to the intended AdMob account.
2. Complete the payment profile with the legal payee's information.
3. In **Apps → Add app**, choose **iOS** and answer **No** when asked whether the app is listed in a supported store.
4. Name it **Inbox.GOP**.
5. Create one native ad unit for the CI feed.
6. Record the AdMob app ID and ad-unit ID in the team's secret/configuration inventory.

AdMob app and ad-unit identifiers are not passwords, but they should still be environment-specific configuration rather than scattered through UI components.

### 2. Add the native SDK to the Expo app

Use the Expo-compatible `react-native-google-mobile-ads` package and its config plugin. Because this includes native iOS code, adding or changing it requires a new EAS/TestFlight build; it cannot ship only as a JavaScript over-the-air update.

Recommended structure:

- `AdProvider` owns consent and SDK initialization;
- `useAdEligibility()` combines authentication, server entitlements, and consent state;
- `FeedAdCard` owns the native-ad view and labeling;
- production and non-production ad IDs come from typed app configuration;
- the feed receives an ordinary render model for an ad slot instead of embedding SDK calls throughout feed logic.

### 3. Make consent happen before ad requests

Integrate Google's User Messaging Platform (UMP):

1. refresh consent information at each app launch;
2. show a consent form when required for the user's region;
3. expose a **Privacy choices** item under Profile/Settings when Google requires one;
4. initialize/request ads only when UMP reports that ads may be requested;
5. continue loading the app normally if consent or the ad network is unavailable.

The privacy policy and App Store privacy answers must be updated before release to accurately describe the final SDK behavior and data collection. We must review the exact SDK version's privacy manifest and Apple's required-reason/API declarations during implementation.

### 4. Use test ads everywhere before public release

- Use Google's demo ad-unit IDs in local, Simulator, development, and TestFlight builds.
- Register physical test devices if testing against the real Inbox.GOP ad unit becomes necessary.
- Never tap live ads during testing.
- Production AdMob IDs should only be active in the public production configuration after policy, consent, store-linking, and readiness steps are complete.

Using live inventory during development can be treated as invalid activity and can jeopardize the AdMob account.

### 5. Publish, link, and verify

After Inbox.GOP has a public App Store listing:

1. link the existing unpublished AdMob app to that exact App Store listing;
2. use the public developer website associated with the listing to host `app-ads.txt` (preferably on `inbox.gop` if that is the developer website shown by Apple);
3. add the exact line supplied by AdMob—do not invent it;
4. confirm the file is publicly reachable at `/app-ads.txt` with no login or redirect problem;
5. wait for AdMob's app-readiness review and resolve any policy findings;
6. enable the production ad-unit ID only after the app is approved/ready.

Google warns that new apps without verified `app-ads.txt` can receive limited ad serving.

## Apple/App Store checklist

Before an ad-supported build is submitted:

- update the App Store privacy questionnaire from the behavior of the actual SDK version;
- update `https://inbox.gop/privacy` to explain advertising, consent, and the relevant providers;
- make the ad obviously identifiable as advertising;
- preserve at least a 44×44 pt interaction target where appropriate;
- ensure an ad never resembles a feed message closely enough to cause accidental taps;
- provide a way to report an inappropriate or age-inappropriate ad if the selected ad format does not already satisfy Apple's requirement;
- choose a suitable maximum ad-content rating in AdMob;
- verify that ads do not use sensitive political data for targeting;
- include reviewer notes explaining that ads appear only on the free plan and where to find them.

## Reliability, security, and privacy requirements

- The API remains the source of truth for plan eligibility.
- Paid accounts must never initialize or request an ad merely to hide it afterward.
- Ad failures must never block or slow feed data.
- No AdMob identifier belongs in Inbox.GOP API logs.
- Do not send Inbox.GOP user IDs, client IDs, email addresses, followed entities, search queries, or feed metadata to AdMob as custom targeting data.
- Record only aggregate operational events needed to understand placement health (for example: slot requested, filled, failed, impression), without PII.
- Ensure logout clears any app-owned ad/session state.
- Re-check eligibility when the app returns to the foreground and when subscription entitlements change.

## Testing and acceptance criteria

### Automated tests

- free entitlement produces `showAds: true`;
- every paid entitlement produces `showAds: false`;
- unknown/malformed/missing entitlement fails closed to `false`;
- ad slots are inserted at the intended intervals without changing feed cursors;
- ads are not counted as messages and do not break saved views, filters, or pagination;
- entitlement refresh removes any eligible/pending ad slot after an upgrade;
- no ad request occurs before consent permits it;
- failed/no-fill requests collapse cleanly.

### Manual TestFlight checks

- free account sees clearly labeled Google test inventory in the intended feed location;
- paid account sends zero ad requests and sees no blank gap;
- dark mode, light mode, Dynamic Type, and Reduce Motion all render correctly;
- VoiceOver announces the content as an advertisement;
- scrolling remains smooth on a real iPhone;
- switching plans or users does not leak the previous user's ad state;
- loss of connectivity never blocks the feed;
- consent and privacy-choice flows work in relevant test geographies;
- the launch animation and Face ID flow are unchanged.

## Rollout plan

1. **Account setup:** Create the unpublished AdMob app, payment profile, and test ad unit.
2. **Test integration:** Add the SDK, UMP, entitlement, and one native feed placement using test ads only.
3. **Policy review:** Update privacy disclosures, App Store answers, ad-reporting path, and content-rating settings.
4. **Store linkage:** After public App Store availability, link the listing and verify `app-ads.txt`.
5. **Limited launch:** Enable production inventory only for free users and monitor crashes, latency, fill rate, impressions, and complaints.
6. **30-day review:** Compare actual revenue with retention and engagement impact before adding more placements or formats.

Do not add interstitial or app-open ads during the initial evaluation. If one native placement produces negligible revenue, we should reassess AdMob versus sponsorship rather than degrade the app with more aggressive ads.

## Information needed when we return to this

- Which legal entity/person will own the AdMob account and receive payments?
- AdMob app ID and native ad-unit ID (once created).
- Whether `inbox.gop` will be the developer website on the App Store listing.
- The final free-versus-paid entitlement response from the backend.
- The approved feed insertion interval.
- Final privacy-policy language and App Store privacy answers.
- A decision on maximum ad-content rating and the ad-reporting user experience.

## Official references

- [Google AdMob getting-started guide](https://support.google.com/admob/answer/15948559?hl=en)
- [Set up a published or unpublished app in AdMob](https://support.google.com/admob/answer/9989980?hl=en-GB)
- [Google Mobile Ads SDK: test ads on iOS](https://developers.google.com/admob/ios/test-ads)
- [Google Mobile Ads SDK: iOS privacy and consent](https://developers.google.com/admob/ios/privacy)
- [Apple: User Privacy and Data Use](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [`react-native-google-mobile-ads` Expo documentation](https://docs.page/invertase/react-native-google-mobile-ads)
