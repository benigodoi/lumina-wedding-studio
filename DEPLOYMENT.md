# Deployment Guide

How Lumina Wedding Studio is built and shipped: web → Google Cloud Run via
GitHub Actions, Android → APK via GitHub Actions (or locally).

## Overview

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | every PR + push to main | type check + build verification |
| `deploy-cloud-run.yml` | push to main (non-android changes) | Docker build → Artifact Registry → Cloud Run |
| `android-build.yml` | manual run, or tag `v*` | builds the APK (signed if keystore secrets exist), uploads as artifact / GitHub release |

---

## 1. Google Cloud setup (one-time)

Requires the `gcloud` CLI authenticated against your project (`gcloud auth login`).

```bash
export PROJECT_ID=your-project-id
export REGION=europe-west1          # must match REGION in deploy-cloud-run.yml

gcloud config set project $PROJECT_ID

# Enable required services
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com iamcredentials.googleapis.com

# Artifact Registry repo for the Docker images (name must match REPOSITORY in the workflow)
gcloud artifacts repositories create lumina \
  --repository-format=docker --location=$REGION

# Server runtime secrets (the values from your .env)
echo -n "YOUR_GEMINI_API_KEY"    | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "YOUR_GOOGLE_CLIENT_ID"  | gcloud secrets create GOOGLE_CLIENT_ID --data-file=-
echo -n "YOUR_GOOGLE_SECRET"     | gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-
```

### Service account + Workload Identity Federation (keyless auth for GitHub)

```bash
# Deployer service account
gcloud iam service-accounts create github-deployer

export SA=github-deployer@$PROJECT_ID.iam.gserviceaccount.com

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/run.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/iam.serviceAccountUser"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"

# Workload Identity pool + GitHub provider
gcloud iam workload-identity-pools create github --location=global
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global --workload-identity-pool=github \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='YOUR_GITHUB_USER/lumina-wedding-studio'"

# Let the GitHub repo impersonate the deployer SA
export POOL_ID=$(gcloud iam workload-identity-pools describe github --location=global --format='value(name)')
gcloud iam service-accounts add-iam-policy-binding $SA \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/$POOL_ID/attribute.repository/YOUR_GITHUB_USER/lumina-wedding-studio"

# Value for the GCP_WORKLOAD_IDENTITY_PROVIDER GitHub secret:
gcloud iam workload-identity-pools providers describe github-provider \
  --location=global --workload-identity-pool=github --format='value(name)'
```

### GitHub secrets for web deploy

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| `GCP_PROJECT_ID` | your project id |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | output of the last command above (`projects/…/providers/github-provider`) |
| `GCP_SERVICE_ACCOUNT` | `github-deployer@PROJECT_ID.iam.gserviceaccount.com` |
| `VITE_SUPABASE_URL` | same as in `.env` |
| `VITE_SUPABASE_ANON_KEY` | same as in `.env` (anon key is public by design; kept as a secret for tidiness) |

Push to `main` → the app deploys. First deploy prints the service URL at the
end of the workflow run.

### After the first deploy

1. Add the Cloud Run URL to **Supabase → Authentication → URL Configuration**
   (site URL / redirect URLs) and to the **Google OAuth client's** authorized
   redirect origins if needed.
2. Set the `VITE_API_BASE_URL` GitHub secret to the Cloud Run URL — the
   Android build needs it (the web build does not; it uses relative URLs).

---

## 2. Android packaging

### One-time: create a release keystore

```bash
keytool -genkeypair -v -keystore release.keystore -alias lumina \
  -keyalg RSA -keysize 2048 -validity 10000
```

Keep `release.keystore` and its passwords safe (password manager). If you lose
it you cannot update the app on users' devices / Play Store. **Never commit
it** — `.gitignore` blocks `*.keystore` / `*.jks`.

### GitHub secrets for signed CI builds

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 release.keystore` (PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore"))`) |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | `lumina` |
| `ANDROID_KEY_PASSWORD` | key password |
| `VITE_API_BASE_URL` | deployed server URL, e.g. `https://lumina-….run.app` |

Run the **Android APK** workflow from the Actions tab (or push a tag like
`v1.0.0`). The APK appears under the run's **Artifacts** (and on the GitHub
release for tags). Without the keystore secrets the workflow falls back to a
debug APK — installable for testing, not for distribution.

### Local builds

```powershell
# Debug APK (no signing needed)
npm run build:android                 # vite build + cap sync   (set VITE_API_BASE_URL in .env first!)
cd android; ./gradlew assembleDebug   # → android/app/build/outputs/apk/debug/app-debug.apk

# Release APK — put the keystore somewhere outside the repo and create android/key.properties:
#   storeFile=C:\\path\\to\\release.keystore
#   storePassword=...
#   keyAlias=lumina
#   keyPassword=...
cd android; ./gradlew assembleRelease # → android/app/build/outputs/apk/release/app-release.apk

# Or open in Android Studio:
npm run android:open
```

Install on a device: enable USB debugging, then `adb install app-debug.apk`,
or just copy the APK to the phone and open it.

### Releasing updates

- Bump `versionCode` (+1, integer) and `versionName` (display string) in
  `android/app/build.gradle` for every release — Android refuses to install
  an APK with the same/lower `versionCode`.
- For the **Play Store**, build an app bundle instead: `./gradlew bundleRelease`
  → `android/app/build/outputs/bundle/release/app-release.aab`.

---

## Notes

- The web frontend gets `VITE_*` values baked in at **build time** (Docker
  build args); the server reads `GEMINI_API_KEY` / `GOOGLE_CLIENT_*` at
  **runtime** from Secret Manager via Cloud Run.
- `server.ts` listens on `$PORT` (Cloud Run injects it, local default 3000).
- Cloud Run scales to zero — the free tier typically covers an app this size.
