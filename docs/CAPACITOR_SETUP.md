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

### Generating Assets

Use a tool like [capacitor-assets](https://github.com/ionic-team/capacitor-assets) to generate all required sizes:

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate
```

Place your source images:
- `resources/icon.png` - 1024x1024 app icon
- `resources/splash.png` - 2732x2732 splash screen

### Manual Asset Locations

**iOS:**
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- `ios/App/App/Assets.xcassets/Splash.imageset/`

**Android:**
- `android/app/src/main/res/mipmap-*/`
- `android/app/src/main/res/drawable/splash.png`

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
