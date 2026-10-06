# MEGA GAME - Android (WebView) notları

- Paket: com.umutk.megagames, ad "MEGA GAME". minSdk 26, AGP 8.5.2, Kotlin 2.0.20, yalnızca core-ktx 1.13.1. INTERNET izni YOK (yalnızca VIBRATE).
- Kaynak: /root/projects/mega.html -> `tools/sync_mega.sh` -> app/src/main/assets/mega.html
  (CDN three.js r128 URL'si `three.min.js` yerel adına çevrilir; assets/three.min.js hazır).
  Ayrıca MainActivity.shouldInterceptRequest, CDN URL'sini yerel dosyaya yönlendirir; diğer http(s) istekleri 403 ile engellenir, blockNetworkLoads açık.
- Geri tuşu: hubScreen gizliyse JS `goHub()` çağrılır; hub'daysa çıkış onayı.
- JS köprüsü: `window.AndroidBridge.vibrate(ms)` (opsiyonel).
- Dayanıklılık: onRenderProcessGone -> WebView yeniden kurulur ve sayfa yüklenir; ana çerçeve hatasında "Tekrar dene" ekranı; largeHeap.
- Kayıtlar: DOM storage/IndexedDB açık (file:// origin'inde kalıcı).
- Derleme + teslim: `bash tools/build_and_deliver.sh` (dosya sistemi noexec olduğundan `bash` ile çalıştırın).
  Çıktı: /root/projects/MegaGames-debug.apk ve /sdcard/Download/MegaGames-debug.apk
- İkon: prosedürel vektör (drawable/ic_launcher_fg/bg, ic_logo); splash: koyu zemin + logo.
