package com.umutk.megagames

import android.content.Context
import android.graphics.BitmapFactory
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** A game from the HTML: a minigame (MINIS) or one of the big AAA modules. */
data class Game(
    val id: String, val title: String, val icon: String, val cat: String, val desc: String,
    val hue: Float, val fresh: Boolean, val aaa: Boolean = false, val tag: String = ""
)

private val Scheme = darkColorScheme(
    primary = Color(0xFF9FA8FF), onPrimary = Color(0xFF111446), primaryContainer = Color(0xFF2B2F78), onPrimaryContainer = Color(0xFFDDE0FF),
    secondary = Color(0xFFC0C4EB), tertiary = Color(0xFFFFB4D0),
    background = Color(0xFF0A0818), surface = Color(0xFF0A0818), surfaceContainer = Color(0xFF161328), surfaceContainerHigh = Color(0xFF1E1A33),
    onSurface = Color(0xFFE6E1F5), onSurfaceVariant = Color(0xFFB0AAC8)
)

/** 3D emoji art bundled in assets/emoji (Microsoft Fluent Emoji, MIT), looked up by code point. */
object EmojiArt {
    private val cache = HashMap<String, ImageBitmap?>()
    private fun key(e: String) = e.filter { it != '️' }.codePoints().toArray().joinToString("-") { Integer.toHexString(it) }

    fun load(ctx: Context, e: String): ImageBitmap? {
        if (cache.containsKey(e)) return cache[e]
        val bmp = try { ctx.assets.open("emoji/${key(e)}.png").use { BitmapFactory.decodeStream(it)?.asImageBitmap() } } catch (_: Exception) { null }
        cache[e] = bmp
        return bmp
    }
}

/** Vector game icons (game-icons.net, CC BY 3.0) bundled as drawables gi_*.xml; assets/gi_map.json maps emoji -> drawable name. */
object GiArt {
    private var map: Map<String, String>? = null
    private fun load(ctx: Context): Map<String, String> = map ?: run {
        val m = HashMap<String, String>()
        try {
            val o = org.json.JSONObject(ctx.assets.open("gi_map.json").bufferedReader().use { it.readText() })
            o.keys().forEach { k -> m[k] = o.getString(k) }
        } catch (_: Exception) {}
        map = m; m
    }
    fun res(ctx: Context, emoji: String): Int {
        val n = load(ctx)[emoji] ?: return 0
        return ctx.resources.getIdentifier(n, "drawable", ctx.packageName)
    }
}

@Composable
private fun Art(icon: String, size: Dp, modifier: Modifier = Modifier) {
    val ctx = LocalContext.current
    val img = remember(icon) { EmojiArt.load(ctx, icon) }
    if (img != null) Image(img, null, modifier.size(size))
    else Box(modifier.size(size), contentAlignment = Alignment.Center) { Text(icon, fontSize = (size.value * .7f).sp) }
}

/** White vector glyph for a game; falls back to the 3D emoji art when no vector exists. */
@Composable
private fun Glyph(icon: String, size: Dp, modifier: Modifier = Modifier, tint: Color = Color.White) {
    val ctx = LocalContext.current
    val id = remember(icon) { GiArt.res(ctx, icon) }
    if (id != 0) Icon(androidx.compose.ui.res.painterResource(id), null, modifier.size(size), tint = tint)
    else Art(icon, size, modifier)
}

private fun tile(hue: Float): Brush = Brush.linearGradient(listOf(Color.hsv(hue % 360f, .62f, .88f), Color.hsv((hue + 40f) % 360f, .78f, .38f)))

/** Cover art for a game: deep gradient, soft light blobs, a dotted texture, a huge faded vector glyph and a glass badge with the sharp icon. */
@Composable
private fun Cover(g: Game, modifier: Modifier, badge: Dp) {
    Box(modifier.background(Brush.linearGradient(listOf(Color.hsv(g.hue % 360f, .70f, .62f), Color.hsv((g.hue + 50f) % 360f, .85f, .22f))))) {
        androidx.compose.foundation.Canvas(Modifier.matchParentSize()) {
            drawCircle(Brush.radialGradient(listOf(Color.hsv((g.hue + 20f) % 360f, .5f, 1f).copy(alpha = .55f), Color.Transparent), center = androidx.compose.ui.geometry.Offset(size.width * .85f, size.height * .15f), radius = size.width * .7f), radius = size.width * .7f, center = androidx.compose.ui.geometry.Offset(size.width * .85f, size.height * .15f))
            drawCircle(Brush.radialGradient(listOf(Color.hsv((g.hue + 300f) % 360f, .7f, .8f).copy(alpha = .35f), Color.Transparent), center = androidx.compose.ui.geometry.Offset(size.width * .1f, size.height * .95f), radius = size.width * .6f), radius = size.width * .6f, center = androidx.compose.ui.geometry.Offset(size.width * .1f, size.height * .95f))
            val step = 14.dp.toPx()
            var y = step / 2
            while (y < size.height) { var x = step / 2; while (x < size.width) { drawCircle(Color.White.copy(alpha = .06f), 1.2.dp.toPx(), androidx.compose.ui.geometry.Offset(x, y)); x += step }; y += step }
        }
        Glyph(g.icon, badge * 2.6f, Modifier.align(Alignment.CenterEnd).offset(x = badge * .7f, y = badge * .25f).rotate(-14f), Color.White.copy(alpha = .13f))
        Box(Modifier.align(Alignment.Center).size(badge * 1.55f).clip(CircleShape).background(Color.White.copy(alpha = .16f)), contentAlignment = Alignment.Center) {
            Glyph(g.icon, badge, tint = Color.White)
        }
    }
}

private fun cap(s: String) = s.lowercase().replaceFirstChar { it.uppercase() }

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun MegaHub(
    games: List<Game>, aaa: List<Game>, recent: List<String>, favs: Set<String>,
    onPlay: (Game) -> Unit, onFav: (Game) -> Unit, onRandom: () -> Unit
) {
    MaterialTheme(colorScheme = Scheme) {
        var q by remember { mutableStateOf("") }
        var cat by remember { mutableStateOf("ALL") }
        var onlyFav by remember { mutableStateOf(false) }
        var onlyNew by remember { mutableStateOf(false) }
        val cats = remember(games) { listOf("ALL") + games.map { it.cat.uppercase() }.distinct().sorted() }
        val filtering = q.isNotBlank() || cat != "ALL" || onlyFav || onlyNew
        val shown = remember(games, q, cat, onlyFav, onlyNew, favs) {
            games.filter { g ->
                (cat == "ALL" || g.cat.equals(cat, true)) && (!onlyFav || g.id in favs) && (!onlyNew || g.fresh) &&
                    (q.isBlank() || g.title.contains(q, true) || g.desc.contains(q, true))
            }
        }
        val byId = remember(games, aaa) { (aaa + games).associateBy { it.id } }
        val continueList = remember(recent, byId) { recent.mapNotNull { byId[it] }.take(10) }
        val full: androidx.compose.foundation.lazy.grid.LazyGridItemSpanScope.() -> GridItemSpan = { GridItemSpan(maxLineSpan) }

        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            LazyVerticalGrid(
                GridCells.Adaptive(160.dp), Modifier.fillMaxSize().statusBarsPadding(),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item(span = full) {
                    Box(Modifier.fillMaxWidth().height(150.dp).clip(RoundedCornerShape(28.dp))
                        .background(Brush.linearGradient(listOf(Color(0xFF3B2A9C), Color(0xFFB0307A), Color(0xFFFF8A3D))))) {
                        androidx.compose.foundation.Canvas(Modifier.matchParentSize()) {
                            drawCircle(Brush.radialGradient(listOf(Color.White.copy(alpha = .35f), Color.Transparent), center = androidx.compose.ui.geometry.Offset(size.width * .8f, 0f), radius = size.width * .6f), radius = size.width * .6f, center = androidx.compose.ui.geometry.Offset(size.width * .8f, 0f))
                            val step = 16.dp.toPx(); var y = step / 2
                            while (y < size.height) { var x = step / 2; while (x < size.width) { drawCircle(Color.White.copy(alpha = .07f), 1.3.dp.toPx(), androidx.compose.ui.geometry.Offset(x, y)); x += step }; y += step }
                        }
                        val hero = (aaa + games).map { it.icon }.distinct().take(5)
                        hero.forEachIndexed { i, ic ->
                            Glyph(ic, (56 - i * 6).dp, Modifier.align(Alignment.CenterEnd).offset(x = (-(i * 46) + 8).dp, y = (if (i % 2 == 0) -22 else 24).dp).rotate((i * 9 - 18).toFloat()), Color.White.copy(alpha = .22f + .1f * (4 - i) / 4f))
                        }
                        Column(Modifier.align(Alignment.CenterStart).padding(start = 20.dp)) {
                            Text("MEGA GAME", fontSize = 30.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = 1.sp)
                            Text("${aaa.size} big games · ${games.size} minigames", fontSize = 13.sp, color = Color.White.copy(alpha = .85f))
                            Text("offline · no ads", fontSize = 12.sp, color = Color.White.copy(alpha = .65f))
                        }
                        IconButton(onRandom, Modifier.align(Alignment.TopEnd).padding(6.dp)) { Icon(Icons.Filled.Casino, "Random game", tint = Color.White, modifier = Modifier.size(28.dp)) }
                    }
                }
                item(span = full) {
                    OutlinedTextField(
                        q, { q = it }, Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(28.dp),
                        placeholder = { Text("Search games") }, leadingIcon = { Icon(Icons.Filled.Search, null) },
                        trailingIcon = { if (q.isNotEmpty()) IconButton({ q = "" }) { Icon(Icons.Filled.Close, "Clear") } },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = MaterialTheme.colorScheme.surfaceContainer,
                            unfocusedContainerColor = MaterialTheme.colorScheme.surfaceContainer, unfocusedBorderColor = Color.Transparent
                        )
                    )
                }
                if (!filtering && aaa.isNotEmpty()) {
                    item(span = full) { SectionTitle(Icons.Filled.Whatshot, "BIG GAMES") }
                    item(span = full) {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(end = 8.dp)) {
                            items(aaa, key = { it.id }) { g -> Banner(g) { onPlay(g) } }
                        }
                    }
                }
                if (!filtering && continueList.isNotEmpty()) {
                    item(span = full) { SectionTitle(Icons.Filled.History, "CONTINUE PLAYING") }
                    item(span = full) {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            items(continueList, key = { it.id }) { g -> MiniTile(g) { onPlay(g) } }
                        }
                    }
                }
                item(span = full) { SectionTitle(Icons.Filled.SportsEsports, if (filtering) "${shown.size} RESULTS" else "${games.size} MINIGAMES") }
                item(span = full) {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        item { FilterChip(onlyFav, { onlyFav = !onlyFav }, { Text("Favorites") }, leadingIcon = { Icon(Icons.Filled.Star, null, Modifier.size(16.dp)) }) }
                        item { FilterChip(onlyNew, { onlyNew = !onlyNew }, { Text("New") }, leadingIcon = { Icon(Icons.Filled.AutoAwesome, null, Modifier.size(16.dp)) }) }
                        items(cats) { c -> FilterChip(cat == c, { cat = c }, { Text(if (c == "ALL") "All" else cap(c)) }) }
                    }
                }
                if (shown.isEmpty()) {
                    item(span = full) { Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) { Text("Nothing here yet.", color = MaterialTheme.colorScheme.onSurfaceVariant) } }
                }
                items(shown, key = { it.id }) { g -> GameCard(g, g.id in favs, { onPlay(g) }, { onFav(g) }) }
                item(span = full) { Spacer(Modifier.navigationBarsPadding()) }
            }
        }
    }
}

@Composable
private fun SectionTitle(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    Row(Modifier.padding(top = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, Modifier.size(18.dp), tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.width(8.dp))
        Text(text, fontSize = 13.sp, letterSpacing = 1.6.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
    }
}

/** Wide banner for the big games: gradient, a giant faded copy of the art behind a sharp one, tag, title and a play button. */
@Composable
private fun Banner(g: Game, onClick: () -> Unit) {
    Box(Modifier.width(310.dp).height(176.dp).clip(RoundedCornerShape(26.dp)).clickable(onClick = onClick)) {
        Cover(g, Modifier.matchParentSize(), 64.dp)
        Box(Modifier.matchParentSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xAA000000)))))
        Column(Modifier.align(Alignment.BottomStart).padding(18.dp)) {
            Text(g.tag.replace("AAA • ", "").ifBlank { "BIG GAME" }, fontSize = 10.sp, letterSpacing = 1.4.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFFE36E))
            Text(g.title, fontSize = 21.sp, fontWeight = FontWeight.Black, color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.widthIn(max = 270.dp))
            Text(g.desc, fontSize = 12.sp, color = Color.White.copy(alpha = .82f), maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.widthIn(max = 230.dp).padding(top = 2.dp))
        }
        Row(
            Modifier.align(Alignment.BottomEnd).padding(14.dp).clip(CircleShape).background(Color.White).padding(horizontal = 14.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Filled.PlayArrow, null, Modifier.size(18.dp), tint = Color.Black)
            Text("PLAY", fontSize = 12.sp, fontWeight = FontWeight.Black, color = Color.Black)
        }
    }
}

@Composable
private fun MiniTile(g: Game, onClick: () -> Unit) {
    Column(Modifier.width(96.dp).clip(RoundedCornerShape(20.dp)).background(MaterialTheme.colorScheme.surfaceContainer).clickable(onClick = onClick).padding(bottom = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Cover(g, Modifier.fillMaxWidth().height(70.dp), 30.dp)
        Text(g.title, Modifier.padding(horizontal = 6.dp, vertical = 6.dp), fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, color = MaterialTheme.colorScheme.onSurface)
    }
}

@Composable
private fun GameCard(g: Game, fav: Boolean, onClick: () -> Unit, onFav: () -> Unit) {
    var pressed by remember { mutableStateOf(false) }
    val sc by animateFloatAsState(if (pressed) .96f else 1f, label = "press")
    Card(
        Modifier.fillMaxWidth().graphicsLayer { scaleX = sc; scaleY = sc }.clickable { pressed = true; onClick(); pressed = false },
        shape = RoundedCornerShape(22.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)
    ) {
        Column {
            Box(Modifier.fillMaxWidth().height(112.dp).clip(RoundedCornerShape(topStart = 22.dp, topEnd = 22.dp))) {
                Cover(g, Modifier.matchParentSize(), 46.dp)
                Text(cap(g.cat), Modifier.align(Alignment.BottomStart).padding(10.dp).clip(RoundedCornerShape(8.dp)).background(Color(0x99000000)).padding(horizontal = 7.dp, vertical = 2.dp), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                if (g.fresh) Text("NEW", Modifier.align(Alignment.TopStart).padding(10.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xCC000000)).padding(horizontal = 7.dp, vertical = 2.dp), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFFE36E))
                Icon(
                    if (fav) Icons.Filled.Star else Icons.Outlined.StarBorder, "Favorite",
                    Modifier.align(Alignment.TopEnd).padding(4.dp).size(36.dp).clip(CircleShape).clickable(onClick = onFav).padding(7.dp),
                    tint = if (fav) Color(0xFFFFE36E) else Color.White.copy(alpha = .9f)
                )
            }
            Column(Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
                Text(g.title, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, color = MaterialTheme.colorScheme.onSurface)
                Text(g.desc, fontSize = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 2.dp))
            }
        }
    }
}
