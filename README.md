# Mega Games

**Dozens of mini games in one app.**

Mega Games bundles a few hundred small games into a single Android app, so you don't have to install a new one every time you want something different to play. Pick one from the hub and you're in. Favourites are saved, and everything works offline: the app doesn't even ask for internet access.

## How it works

The games are written in HTML, JavaScript and three.js. The app shows them in a WebView, with a native hub on top that lists the games and remembers your favourites. The hub is built with Jetpack Compose and Material You.

## Building

Needs Android 8.0 (API 26) or newer.

```sh
gradle assembleRelease
```

The APK ends up in `app/build/outputs/apk/release/`.

## Developer

xUmutKx
