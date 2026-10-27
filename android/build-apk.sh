#!/usr/bin/env bash
# Builds the SnagChat APK: web app -> Android assets -> debug APK.
#
# Needs JDK 17, an Android SDK with platform 34 and build-tools 34.0.0, and
# Gradle 8.7. Point JAVA_HOME / ANDROID_HOME / GRADLE at them, or let the script
# fall back to the toolchain kept in .toolchain/ (see the README).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$ROOT/.toolchain"

JAVA_HOME="${JAVA_HOME:-$(ls -d "$TOOLS"/jdk-* 2>/dev/null | head -1)}"
ANDROID_HOME="${ANDROID_HOME:-$TOOLS/sdk}"
GRADLE="${GRADLE:-$(ls -d "$TOOLS"/gradle-* 2>/dev/null | head -1)/bin/gradle}"

[ -x "$JAVA_HOME/bin/java" ] || { echo "No JDK found. Set JAVA_HOME."; exit 1; }
[ -d "$ANDROID_HOME/platforms/android-34" ] || { echo "No Android platform 34 in ANDROID_HOME ($ANDROID_HOME)."; exit 1; }
[ -x "$GRADLE" ] || { echo "No Gradle found. Set GRADLE."; exit 1; }

export JAVA_HOME ANDROID_HOME

echo "==> building the web app"
cd "$ROOT"
npm run build

echo "==> copying the web build into the APK assets"
rm -rf "$ROOT/android/app/src/main/assets"
mkdir -p "$ROOT/android/app/src/main/assets"
cp -R "$ROOT/dist/." "$ROOT/android/app/src/main/assets/"

echo "==> gradle assembleDebug"
cd "$ROOT/android"
echo "sdk.dir=$ANDROID_HOME" > local.properties
"$GRADLE" --no-daemon assembleDebug

echo "==> copying the APK out"
cp "$ROOT/android/app/build/outputs/apk/debug/app-debug.apk" "$ROOT/snagchat.apk"
du -h "$ROOT/snagchat.apk"
