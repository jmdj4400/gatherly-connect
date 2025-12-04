# Capacitor Setup Guide - Gatherly Native Apps

This guide explains how to build and deploy Gatherly as native iOS and Android apps using Capacitor.

## Prerequisites

### For iOS Development
- **Mac** with macOS 12.0 or later
- **Xcode 14+** installed from the Mac App Store
- **Apple Developer Account** ($99/year) for App Store distribution
- **CocoaPods** installed: `sudo gem install cocoapods`

### For Android Development
- **Android Studio** (Arctic Fox or later)
- **JDK 11+** installed
- **Google Play Developer Account** ($25 one-time fee) for Play Store distribution

## Initial Setup

### 1. Export to GitHub

First, export your Lovable project to GitHub:
1. Click the **"Export to GitHub"** button in Lovable
2. Choose or create a repository
3. Wait for the export to complete

### 2. Clone and Install

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Install dependencies
npm install
```

### 3. Add Native Platforms

```bash
# Add iOS platform (Mac only)
npx cap add ios

# Add Android platform
npx cap add android
```

### 4. Build and Sync

```bash
# Build the web app
npm run build

# Sync to native platforms
npx cap sync
```

## Development Workflow

### Running on Devices/Emulators

```bash
# Run on iOS simulator or device
npx cap run ios

# Run on Android emulator or device
npx cap run android

# Open in native IDE for debugging
npx cap open ios
npx cap open android
```

### Hot Reload Development

The project is configured for hot reload during development. The app will automatically connect to:
```
https://e69de0b4-bdc6-4c90-869d-333dc3c5ea8a.lovableproject.com
```

When you make changes in Lovable, they'll appear in the native app immediately.

### Syncing Changes

After pulling changes from GitHub:
```bash
git pull
npm install
npm run build
npx cap sync
```

## Push Notifications Setup

### iOS (APNs)

1. **Create App ID** in Apple Developer Portal with Push Notifications capability
2. **Generate APNs Key** (p8 file) in Certificates, Identifiers & Profiles
3. **Upload APNs Key** to your push notification service (Supabase or Firebase)
4. **Add Push Notification capability** in Xcode:
   - Open `ios/App/App.xcworkspace`
   - Select your target → Signing & Capabilities
   - Add "Push Notifications" capability

### Android (FCM)

1. **Create Firebase Project** at [Firebase Console](https://console.firebase.google.com)
2. **Add Android App** with package name: `app.lovable.e69de0b4bdc64c90869d333dc3c5ea8a`
3. **Download `google-services.json`** and place in `android/app/`
4. **Add Firebase dependencies** (already configured in build.gradle)

## App Store Submission

### iOS App Store

1. **Configure App in App Store Connect**
   - Create new app
   - Set bundle ID: `app.lovable.e69de0b4bdc64c90869d333dc3c5ea8a`
   - Fill in app information

2. **Archive and Upload**
   ```bash
   # Build for release
   npm run build
   npx cap sync ios
   
   # Open in Xcode
   npx cap open ios
   ```
   - In Xcode: Product → Archive
   - Distribute App → App Store Connect

3. **Submit for Review**
   - Add screenshots and descriptions
   - Set pricing and availability
   - Submit for review

### Google Play Store

1. **Generate Signed APK/Bundle**
   ```bash
   # Build for release
   npm run build
   npx cap sync android
   
   # Open in Android Studio
   npx cap open android
   ```
   - Build → Generate Signed Bundle / APK
   - Choose Android App Bundle (AAB)

2. **Create App in Play Console**
   - Set package name: `app.lovable.e69de0b4bdc64c90869d333dc3c5ea8a`
   - Upload AAB
   - Fill in store listing

3. **Submit for Review**
   - Complete content rating questionnaire
   - Set pricing and distribution
   - Roll out to production

## App Icons and Splash Screens

### Source Images Required

Create these source images in the `resources/` folder:

| File | Size | Description |
|------|------|-------------|
| `resources/icon.png` | 1024x1024 | Main app icon (PNG, no transparency for iOS) |
| `resources/splash.png` | 2732x2732 | Light mode splash screen |
| `resources/splash-dark.png` | 2732x2732 | Dark mode splash screen (optional) |

### Design Guidelines

**App Icon:**
- Use a simple, recognizable design
- Avoid text (too small on most sizes)
- iOS will automatically round corners
- Android uses adaptive icons (foreground + background)

**Splash Screen:**
- Center your logo/branding
- Use your brand background color
- Keep important content in the center 1200x1200 safe zone
- Same image works for all device sizes

### Generating All Sizes

After adding your source images, run:

```bash
# Generate all icon and splash screen sizes
npx @capacitor/assets generate

# Or generate only icons
npx @capacitor/assets generate --iconOnly

# Or generate only splash screens
npx @capacitor/assets generate --splashOnly
```

This automatically generates:

**iOS (in `ios/App/App/Assets.xcassets/`):**
- AppIcon.appiconset (20x20 to 1024x1024)
- Splash.imageset (portrait and landscape)

**Android (in `android/app/src/main/res/`):**
- mipmap-mdpi through mipmap-xxxhdpi (48x48 to 192x192)
- drawable/splash.png
- Adaptive icon foreground/background

### Configuration

The `capacitor-assets.config.json` file controls asset generation:

```json
{
  "iconBackgroundColor": "#0a0a0a",
  "splashBackgroundColor": "#0a0a0a",
  "ios": {
    "iconOriginal": "resources/icon.png",
    "splashOriginal": "resources/splash.png"
  },
  "android": {
    "iconOriginal": "resources/icon.png",
    "splashOriginal": "resources/splash.png"
  }
}
```

### Manual Asset Locations (Reference)

**iOS:**
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- `ios/App/App/Assets.xcassets/Splash.imageset/`

**Android:**
- `android/app/src/main/res/mipmap-*/` (icons)
- `android/app/src/main/res/drawable/` (splash)

## Deep Linking

### Custom URL Scheme

The app supports the `gatherly://` URL scheme for deep links:

- `gatherly://event/EVENT_ID` - Open an event
- `gatherly://chat/GROUP_ID` - Open a group chat
- `gatherly://profile` - Open profile
- `gatherly://explore` - Open explore page

### Universal Links (iOS)

To enable universal links on iOS:

1. **Add Associated Domains capability** in Xcode:
   - Open `ios/App/App.xcworkspace`
   - Select target → Signing & Capabilities
   - Add "Associated Domains" capability
   - Add: `applinks:gatherly.app`

2. **Create apple-app-site-association file** on your domain:
   ```json
   {
     "applinks": {
       "apps": [],
       "details": [{
         "appID": "TEAM_ID.app.lovable.e69de0b4bdc64c90869d333dc3c5ea8a",
         "paths": ["/event/*", "/chat/*", "/c/*"]
       }]
     }
   }
   ```

### App Links (Android)

To enable app links on Android, add to `android/app/src/main/AndroidManifest.xml`:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="gatherly.app" android:pathPrefix="/event" />
  <data android:scheme="https" android:host="gatherly.app" android:pathPrefix="/chat" />
</intent-filter>

<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="gatherly" />
</intent-filter>
```

## Troubleshooting

### Common Issues

**"Unable to load asset" errors:**
```bash
npx cap sync
```

**iOS signing issues:**
- Ensure you have a valid provisioning profile
- Check bundle ID matches your App ID

**Android build fails:**
- Ensure Android SDK is properly configured
- Check JDK version: `java -version`

**Push notifications not working:**
- iOS: Verify APNs certificate/key is configured
- Android: Verify `google-services.json` is in place

**Deep links not working:**
- iOS: Verify associated domains are correctly configured
- Android: Verify intent-filters in AndroidManifest.xml
- Test with: `adb shell am start -a android.intent.action.VIEW -d "gatherly://event/123"`

### Getting Help

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Lovable Documentation](https://docs.lovable.dev)
- [Capacitor Community Forum](https://forum.ionicframework.com/c/capacitor)

## Configuration Reference

### capacitor.config.ts

| Property | Value | Description |
|----------|-------|-------------|
| appId | `app.lovable.e69de0b4bdc64c90869d333dc3c5ea8a` | Unique app identifier |
| appName | `gatherlyconnect` | Display name |
| webDir | `dist` | Build output directory |
| server.url | Lovable preview URL | Hot reload URL |

### Installed Plugins

| Plugin | Purpose |
|--------|---------|
| @capacitor/push-notifications | Native push notifications |
| @capacitor/splash-screen | Native splash screen |
| @capacitor/status-bar | Status bar control |
| @capacitor/app | App lifecycle events |
| @capacitor/haptics | Vibration feedback |

## Build Checklist

Before submitting to app stores, ensure:

- [ ] App icons generated for all sizes
- [ ] Splash screens generated for all sizes
- [ ] Push notification certificates configured
- [ ] Deep links tested and working
- [ ] Privacy policy page accessible
- [ ] Terms of service page accessible
- [ ] All features tested on physical devices
- [ ] Performance tested (no major lag or crashes)
- [ ] Offline mode works correctly
