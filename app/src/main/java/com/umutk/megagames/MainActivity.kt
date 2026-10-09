package com.umutk.megagames

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Context
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.*
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.ComposeView
import org.json.JSONObject
import org.json.JSONTokener
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import java.io.ByteArrayInputStream

class MainActivity : ComponentActivity() {
    private var games by mutableStateOf<List<Game>>(emptyList())
    private var aaa by mutableStateOf<List<Game>>(emptyList())
    private var recent by mutableStateOf<List<String>>(emptyList())
    private var hubVisible by mutableStateOf(false)
    private var favs by mutableStateOf(setOf<String>())
    private val handler = android.os.Handler(android.os.Looper.getMainLooper())
    private val poll = object : Runnable {
        override fun run() { pollHub(); handler.postDelayed(this, if (shown) 450 else 120) }
    }
    private lateinit var web: WebView
    private lateinit var root: FrameLayout
    private lateinit var errorView: LinearLayout
    private var failed = false
    /** The classic HTML hub must never show before the native hub is up (it flashed for ~0.5s on start). */
    private var shown = false
    private var safeTopCss = 0f
    private fun pushSafeTop() {
        if (::web.isInitialized) web.evaluateJavascript("document.documentElement.style.setProperty('--safe-top','" + safeTopCss + "px')", null)
    }
    private fun reveal() { if (!shown) { shown = true; web.postDelayed({ web.animate().alpha(1f).setDuration(120).start() }, 140) } }

    companion object {
        const val URL = "file:///android_asset/mega.html"
        val AAA_HUES = mapOf("blade" to 200f, "nebula" to 262f, "voxel" to 128f, "calradia" to 28f, "drift3d" to 332f, "spellmerge" to 285f, "fighter" to 188f)
        const val THREE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        const val POLL_JS = "(function(){try{var h=document.getElementById('hubScreen');var o={v:!!(h&&!h.classList.contains('hidden'))};" +
            "if(!window.__nGames&&typeof MINIS!=='undefined'&&MINIS.length){o.g=MINIS.map(function(m,i){return{id:m.id,t:m.title,i:m.icon,c:m.cat,d:m.desc,h:m.hue||0,n:i>=128}});" +
            "if(typeof AAA!=='undefined')o.a=AAA.map(function(m){return{id:m.id,t:m.title,i:m.icon,c:m.tag,d:m.desc}});window.__nGames=1}" +
            "return JSON.stringify(o)}catch(e){return '{}'}})()"
        const val BACK_JS = "(function(){try{var h=document.getElementById('hubScreen');" +
            "if(h&&h.classList.contains('hidden')&&typeof goHub==='function'){goHub();return 'back';}}catch(e){}return 'none';})()"
    }

    inner class Bridge {
        @JavascriptInterface
        fun vibrate(ms: Int) {
            try {
                val v = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                val d = ms.coerceIn(1, 2000).toLong()
                if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(d, VibrationEffect.DEFAULT_AMPLITUDE))
                else @Suppress("DEPRECATION") v.vibrate(d)
            } catch (_: Throwable) {}
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        if (Build.VERSION.SDK_INT >= 28)
            window.attributes.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        root = FrameLayout(this).apply { setBackgroundColor(Color.parseColor("#0A0818")) }
        setContentView(root)
        buildErrorView()
        createWebView()
        val prefs = getSharedPreferences("mega", MODE_PRIVATE)
        favs = prefs.getStringSet("favs", emptySet()) ?: emptySet()
        recent = (prefs.getString("recent", "") ?: "").split(',').filter { it.isNotBlank() }
        root.addView(ComposeView(this).apply {
            setContent {
                if (games.isNotEmpty() && hubVisible) MegaHub(games, aaa, recent, favs, ::play, ::toggleFav, { games.randomOrNull()?.let(::play) })
            }
        }, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        // tell the page how much room the camera cutout / status bar takes at the top (--safe-top), so top buttons never sit under it
        androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(root) { _, insets ->
            val bars = insets.getInsetsIgnoringVisibility(WindowInsetsCompat.Type.systemBars()).top
            val cut = insets.getInsets(WindowInsetsCompat.Type.displayCutout()).top
            safeTopCss = maxOf(bars, cut) / resources.displayMetrics.density
            pushSafeTop()
            insets
        }
        immersive()
        web.alpha = 0f
        web.loadUrl(URL)
        handler.postDelayed({ reveal() }, 5000) // safety net: show the page even if no games could be read
        handler.postDelayed(poll, 150)
    }

    private fun buildErrorView() {
        errorView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#0A0818")); visibility = View.GONE
            addView(TextView(context).apply {
                text = "Yükleme hatası"; setTextColor(Color.WHITE); textSize = 22f; gravity = Gravity.CENTER
            })
            addView(Button(context).apply {
                text = "Tekrar dene"
                setOnClickListener { failed = false; errorView.visibility = View.GONE; web.visibility = View.VISIBLE; web.loadUrl(URL) }
            })
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView() {
        web = WebView(this)
        web.setBackgroundColor(Color.parseColor("#0A0818"))
        if (!shown) web.alpha = 0f
        root.addView(web, 0, ViewGroup.LayoutParams.MATCH_PARENT.let { ViewGroup.LayoutParams(it, it) })
        root.addView(errorView, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        web.overScrollMode = View.OVER_SCROLL_NEVER
        web.isScrollbarFadingEnabled = true
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            allowContentAccess = false
            @Suppress("DEPRECATION") allowFileAccessFromFileURLs = false
            @Suppress("DEPRECATION") allowUniversalAccessFromFileURLs = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            blockNetworkLoads = true
            cacheMode = WebSettings.LOAD_DEFAULT
            setSupportZoom(false); builtInZoomControls = false
            useWideViewPort = true; loadWithOverviewMode = false
            textZoom = 100
        }
        web.addJavascriptInterface(Bridge(), "AndroidBridge")
        web.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) { request?.deny() }
        }
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                val u = request.url.toString()
                if (u.startsWith(THREE_CDN)) {
                    return try {
                        WebResourceResponse("application/javascript", "UTF-8", assets.open("three.min.js"))
                    } catch (e: Exception) { null }
                }
                if (u.startsWith("http://") || u.startsWith("https://")) {
                    return WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", emptyMap(), ByteArrayInputStream(ByteArray(0)))
                }
                return null
            }
            override fun onPageFinished(view: WebView?, url: String?) { pushSafeTop() }
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) = true
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) showError()
            }
            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                root.removeView(web); try { web.destroy() } catch (_: Throwable) {}
                createWebView(); failed = false; errorView.visibility = View.GONE
                web.loadUrl(URL)
                return true
            }
        }
    }


    private fun pollHub() {
        if (failed) return
        web.evaluateJavascript(POLL_JS) { r ->
            try {
                val str = JSONTokener(r ?: return@evaluateJavascript).nextValue() as? String ?: return@evaluateJavascript
                val o = JSONObject(str)
                if (o.has("v")) hubVisible = o.getBoolean("v")
                o.optJSONArray("g")?.let { a ->
                    reveal()
                    games = (0 until a.length()).map { i ->
                        val m = a.getJSONObject(i); val id = m.getString("id")
                        val hue = m.optDouble("h", 0.0).toFloat().let { if (it == 0f) (Math.abs(id.hashCode()) % 360).toFloat() else it }
                        Game(id, m.optString("t", id), m.optString("i", "🎮"), m.optString("c", "ARCADE"), m.optString("d", ""), hue, m.optBoolean("n"))
                    }
                    o.optJSONArray("a")?.let { b ->
                        aaa = (0 until b.length()).map { i ->
                            val m = b.getJSONObject(i); val id = m.getString("id")
                            Game(id, m.optString("t", id), m.optString("i", "🎮"), "AAA", m.optString("d", ""), AAA_HUES[id] ?: (Math.abs(id.hashCode()) % 360).toFloat(), false, true, m.optString("c", ""))
                        }
                    }
                }
            } catch (_: Throwable) {}
        }
    }

    private fun play(g: Game) {
        hubVisible = false
        recent = (listOf(g.id) + recent.filter { it != g.id }).take(12)
        getSharedPreferences("mega", MODE_PRIVATE).edit().putString("recent", recent.joinToString(",")).apply()
        val js = if (g.aaa) "launchAAA(" + JSONObject.quote(g.id) + ")"
                 else "(function(){var g=MINIS.find(function(m){return m.id===" + JSONObject.quote(g.id) + "});if(g)hubOpen(g)})()"
        web.evaluateJavascript(js, null)
    }

    private fun toggleFav(g: Game) {
        favs = if (g.id in favs) favs - g.id else favs + g.id
        getSharedPreferences("mega", MODE_PRIVATE).edit().putStringSet("favs", favs).apply()
    }

    private fun showError() { failed = true; web.visibility = View.GONE; errorView.visibility = View.VISIBLE }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (failed) { confirmExit(); return }
        web.evaluateJavascript(BACK_JS) { r ->
            if (r == null || !r.contains("back")) confirmExit()
        }
    }

    private fun confirmExit() {
        AlertDialog.Builder(this).setTitle("MEGA GAME").setMessage("Uygulamadan çıkılsın mı?")
            .setPositiveButton("Çık") { _, _ -> finish() }
            .setNegativeButton("Kal", null).show()
    }

    private fun immersive() {
        val c = WindowInsetsControllerCompat(window, window.decorView)
        c.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        c.hide(WindowInsetsCompat.Type.systemBars())
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus); if (hasFocus) immersive()
    }
    override fun onPause() { web.onPause(); super.onPause() }
    override fun onResume() { super.onResume(); web.onResume() }
    override fun onDestroy() { handler.removeCallbacks(poll); root.removeAllViews(); web.destroy(); super.onDestroy() }
}
