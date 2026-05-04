# Running the App

How to run the mobile app, web CMS, and backend across the three environments.

| Environment | Backend | Web CMS | Mobile |
|---|---|---|---|
| **Local** | Supabase on Docker (local) | `next dev` on localhost:3000 | Expo dev server + dev client on simulator or device |
| **Preview** | Supabase Cloud (production project) | Vercel preview URL (per PR) | EAS internal build — install via link on device |
| **Production** | Supabase Cloud (production project) | Vercel production deployment | App Store / Google Play |

---

## Local development

All three pieces run on your machine. This is the normal day-to-day flow.

### 1. Start the backend

```bash
supabase start
```

Starts the full Supabase stack in Docker:

| Service | URL |
|---|---|
| API (PostgREST + Auth + Storage) | http://127.0.0.1:54321 |
| Postgres | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Studio | http://127.0.0.1:54323 |
| Inbucket (email) | http://127.0.0.1:54324 |

After first start (or after `supabase db reset`), the database is empty. If you need test data for manual exploration, run the seed script:

```bash
cd apps/web
pnpm seed      # inserts beheerder + lid + family fixture
pnpm teardown  # removes them again
```

See [TESTING_LOCAL.md](TESTING_LOCAL.md) for the full picture on seeding.

To apply new migrations after pulling from the repo:

```bash
supabase db reset   # drops DB, re-applies all migrations
```

To stop:

```bash
supabase stop
```

### 2. Start the web CMS

```bash
cd apps/web
pnpm dev
```

Opens at [http://localhost:3000](http://localhost:3000). Requires `apps/web/.env.local`.

**Creating `apps/web/.env.local` (first time):**

Run `supabase status` while the local stack is running to get the keys, then create the file:

```
SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=<publishable key from supabase status>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<same key>
SUPABASE_SECRET_KEY=<secret key from supabase status>
```

The publishable key is safe to expose to the browser. The secret key must stay server-side only — it is never passed to `NEXT_PUBLIC_*`.

### 3. Start the mobile app

The app uses `expo-dev-client`, which means it cannot run in plain Expo Go. You need either the dev client installed on a simulator/device, or you build and install it natively.

#### Option A — iOS Simulator (fastest)

```bash
cd apps/mobile
pnpm ios
```

This compiles the native shell and launches it directly on the iOS Simulator. Requires Xcode.

#### Option B — Android Emulator

```bash
cd apps/mobile
pnpm android
```

Requires Android Studio and a running emulator.

#### Option C — Start Expo dev server (connect existing dev client)

If you already have a dev client build installed on a device or simulator:

```bash
cd apps/mobile
pnpm start
```

Then press `i` for iOS simulator, `a` for Android, or scan the QR code with the dev client app on a physical device.

**Creating `apps/mobile/.env.local` (first time):**

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key from supabase status>
```

> **Note for physical devices:** `127.0.0.1` refers to the device itself, not your Mac. Replace it with your Mac's local IP address (e.g. `http://192.168.1.x:54321`) so the device can reach the local Supabase stack.

#### Building a local dev client via EAS

If you need a fresh dev client binary (e.g. after adding a new native module):

```bash
cd apps/mobile

# iOS simulator binary (no Apple Developer account needed)
eas build --profile development --platform ios

# Android APK for internal distribution
eas build --profile development --platform android
```

The `development` EAS profile builds with `developmentClient: true` and targets the iOS simulator (not a real device). The resulting build connects back to your local Expo dev server.

---

## Preview environment

Preview builds are created automatically on every pull request (via GitHub Actions). They let you test changes on a real device before merging.

### Mobile — installing a preview build

When a PR is opened or updated, the `eas-preview.yml` workflow builds the `preview` EAS profile for Android. Once the build finishes:

1. Open the [EAS build dashboard](https://expo.dev/accounts/sc-muiden/projects/sc-muiden-app/builds)
2. Find the build for your branch
3. Download the APK and install it on an Android device (or use the EAS share link)

The preview profile targets the `preview` OTA channel. Any subsequent `eas update --channel preview` pushes JS updates over the air without a new build.

iOS preview builds require an Apple Developer account and registered device UDIDs. These are not set up in the current CI config — iOS preview testing happens on the simulator via the `development` profile.

### Web CMS — preview URL

Vercel creates a unique preview URL for every PR automatically. Find it in the GitHub PR status check or in the Vercel dashboard. Preview deployments use the same environment variables as production (configured in Vercel's project settings).

### Backend

Preview and production both use the same Supabase Cloud project. There is currently no separate staging Supabase project. Keep this in mind when running destructive operations against preview — they hit the real database.

---

## Production environment

Production deployments happen automatically when a PR merges to `main`.

### Mobile

The `eas-production.yml` workflow builds the `production` EAS profile for both iOS and Android. The Android build is submitted to the Play Store internal track automatically. iOS submission requires a manual step via App Store Connect.

To trigger a production build manually:

```bash
cd apps/mobile
eas build --profile production --platform all
```

### Web CMS

The `deploy-web.yml` workflow deploys the Next.js app to Vercel production on every push to `main`. The production URL is configured in Vercel's project settings.

To deploy manually (requires Vercel CLI and credentials):

```bash
cd apps/web
vercel --prod
```

### Backend — linking to the remote Supabase project

To run migrations or manage the remote Supabase project from the CLI:

```bash
# Link this local repo to the remote project (one-time per machine)
supabase link --project-ref <project-ref>

# Push local migrations to the remote project
supabase db push

# Pull remote schema changes back to local
supabase db pull
```

The project ref is available in the Supabase dashboard under Project Settings → General.

Edge functions are deployed with:

```bash
supabase functions deploy federation-sync
supabase functions deploy push-trigger
```

Environment variables for edge functions (KNVB/KNHB API keys, Expo push token) are set in the Supabase dashboard under Edge Functions → Secrets, not in any local file.

---

## Environment variables reference

### Mobile (`apps/mobile/.env.local`)

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase API URL. Local: `http://127.0.0.1:54321`. Production: Supabase Cloud URL. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key. Safe to embed in the app bundle. |

`EXPO_PUBLIC_*` variables are baked into the app bundle at build time. A new EAS build is required to change them in production.

### Web CMS (`apps/web/.env.local`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase API URL (server-side only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL (client-side browser) |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key (server-side) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (client-side browser) |
| `SUPABASE_SECRET_KEY` | Secret (service role) key — server-side only, never expose to browser |

### Backend / Edge Functions (`supabase/.env.local`)

| Variable | Description |
|---|---|
| `KNVB_API_KEY` | KNVB Data Service API key (football schedule sync) |
| `KNHB_API_KEY` | KNHB API key (hockey schedule sync) |
| `EXPO_PUSH_ACCESS_TOKEN` | Expo Push Notifications access token |

These are only used by Supabase Edge Functions and are never referenced by the mobile app or web CMS directly.
