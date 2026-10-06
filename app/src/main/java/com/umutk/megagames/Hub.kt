package com.umutk.megagames

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** HTML'deki MINIS tablosundan gelen bir oyun. */
data class Game(val id: String, val title: String, val icon: String, val cat: String, val desc: String, val hue: Float, val fresh: Boolean)

private val Scheme = darkColorScheme(
    primary = Color(0xFF9FA8FF), onPrimary = Color(0xFF111446), primaryContainer = Color(0xFF2B2F78), onPrimaryContainer = Color(0xFFDDE0FF),
    secondary = Color(0xFFC0C4EB), tertiary = Color(0xFFFFB4D0),
    background = Color(0xFF0A0818), surface = Color(0xFF0A0818), surfaceContainer = Color(0xFF161328), surfaceContainerHigh = Color(0xFF1E1A33), onSurface = Color(0xFFE6E1F5), onSurfaceVariant = Color(0xFFB0AAC8)
)

private fun tile(hue: Float): Brush = Brush.linearGradient(listOf(Color.hsv(hue % 360f, .62f, .85f), Color.hsv((hue + 40f) % 360f, .75f, .42f)))

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun MegaHub(games: List<Game>, favs: Set<String>, onPlay: (Game) -> Unit, onFav: (Game) -> Unit, onClassic: () -> Unit, onRandom: () -> Unit) {
    MaterialTheme(colorScheme = Scheme) {
        var q by remember { mutableStateOf("") }
        var cat by remember { mutableStateOf("ALL") }
        var onlyFav by remember { mutableStateOf(false) }
        var onlyNew by remember { mutableStateOf(false) }
        val cats = remember(games) { listOf("ALL") + games.map { it.cat.uppercase() }.distinct().sorted() }
        val shown = remember(games, q, cat, onlyFav, onlyNew, favs) {
            games.filter { g ->
                (cat == "ALL" || g.cat.equals(cat, true)) && (!onlyFav || g.id in favs) && (!onlyNew || g.fresh) &&
                    (q.isBlank() || g.title.contains(q, true) || g.desc.contains(q, true))
            }
        }
        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            Column(Modifier.fillMaxSize().statusBarsPadding()) {
                Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp, top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("MEGA GAME", fontSize = 26.sp, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary)
                        Text("${games.size} games • offline", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    IconButton(onRandom) { Icon(Icons.Filled.Casino, "Random game", tint = MaterialTheme.colorScheme.primary) }
                    IconButton(onClassic) { Icon(Icons.Filled.Widgets, "Classic hub", tint = MaterialTheme.colorScheme.onSurfaceVariant) }
                }
                OutlinedTextField(
                    q, { q = it }, Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), singleLine = true, shape = RoundedCornerShape(28.dp),
                    placeholder = { Text("Search games") }, leadingIcon = { Icon(Icons.Filled.Search, null) },
                    trailingIcon = { if (q.isNotEmpty()) IconButton({ q = "" }) { Icon(Icons.Filled.Close, "Clear") } },
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search), keyboardActions = KeyboardActions(),
                    colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = MaterialTheme.colorScheme.surfaceContainer, unfocusedContainerColor = MaterialTheme.colorScheme.surfaceContainer, unfocusedBorderColor = Color.Transparent)
                )
                LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item { FilterChip(onlyFav, { onlyFav = !onlyFav }, { Text("Favorites") }, leadingIcon = { Icon(Icons.Filled.Star, null, Modifier.size(16.dp)) }) }
                    item { FilterChip(onlyNew, { onlyNew = !onlyNew }, { Text("New") }, leadingIcon = { Icon(Icons.Filled.AutoAwesome, null, Modifier.size(16.dp)) }) }
                    items(cats) { c -> FilterChip(cat == c, { cat = c }, { Text(if (c == "ALL") "All" else c.lowercase().replaceFirstChar { it.uppercase() }) }) }
                }
                Spacer(Modifier.height(8.dp))
                if (shown.isEmpty()) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("Nothing here yet.", color = MaterialTheme.colorScheme.onSurfaceVariant) }
                } else LazyVerticalGrid(
                    GridCells.Adaptive(150.dp), Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 24.dp + 0.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(shown, key = { it.id }) { g -> GameCard(g, g.id in favs, { onPlay(g) }, { onFav(g) }) }
                    item { Spacer(Modifier.navigationBarsPadding()) }
                }
            }
        }
    }
}

@Composable
private fun GameCard(g: Game, fav: Boolean, onClick: () -> Unit, onFav: () -> Unit) {
    var pressed by remember { mutableStateOf(false) }
    val sc by animateFloatAsState(if (pressed) .96f else 1f, label = "press")
    Card(
        Modifier.fillMaxWidth().graphicsScale(sc).clickable { pressed = true; onClick(); pressed = false },
        shape = RoundedCornerShape(22.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)
    ) {
        Column {
            Box(Modifier.fillMaxWidth().height(96.dp).background(tile(g.hue)), contentAlignment = Alignment.Center) {
                Text(g.icon, fontSize = 46.sp)
                if (g.fresh) Text("NEW", Modifier.align(Alignment.TopStart).padding(10.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xCC000000)).padding(horizontal = 7.dp, vertical = 2.dp), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFFE36E))
                Icon(if (fav) Icons.Filled.Star else Icons.Outlined.StarBorder, "Favorite", Modifier.align(Alignment.TopEnd).padding(4.dp).size(36.dp).clip(CircleShape).clickable(onClick = onFav).padding(7.dp), tint = if (fav) Color(0xFFFFE36E) else Color.White.copy(alpha = .85f))
            }
            Column(Modifier.padding(12.dp)) {
                Text(g.title, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, color = MaterialTheme.colorScheme.onSurface)
                Text(g.cat.lowercase().replaceFirstChar { it.uppercase() }, fontSize = 11.sp, color = MaterialTheme.colorScheme.primary)
                Text(g.desc, fontSize = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 2.dp))
            }
        }
    }
}

private fun Modifier.graphicsScale(s: Float) = this.then(Modifier.graphicsLayer { scaleX = s; scaleY = s })
