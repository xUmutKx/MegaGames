#!/bin/bash
# sync + assembleDebug + APK'yi teslim et
set -e
D="$(cd "$(dirname "$0")/.." && pwd)"
bash "$D/tools/sync_mega.sh" "$@"
cd "$D"
flock /tmp/gradle.lock /root/tools/gradle-8.9/bin/gradle assembleDebug --offline --no-daemon
APK="$D/app/build/outputs/apk/debug/app-debug.apk"
cp "$APK" /root/projects/MegaGames-debug.apk
mkdir -p /sdcard/Download && cp "$APK" /sdcard/Download/MegaGames-debug.apk
ls -la /root/projects/MegaGames-debug.apk /sdcard/Download/MegaGames-debug.apk
