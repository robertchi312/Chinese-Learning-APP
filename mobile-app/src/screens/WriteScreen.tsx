import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { CHARACTERS } from '../data/characters';
import { colors } from '../theme';

// Stroke practice via Hanzi Writer running inside a WebView.
// Stroke-order data is fetched from the jsdelivr CDN, so this screen
// needs a network connection the first time each character is loaded.
export default function WriteScreen() {
  const [index, setIndex] = useState(0);
  const c = CHARACTERS[index];

  const html = useMemo(
    () => `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<style>
  body { margin:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
         min-height:100vh; background:#faf7f2; font-family:sans-serif; }
  #target { background:#fff; border:1px solid #e5e7eb; border-radius:16px; }
  .row { margin-top:14px; display:flex; gap:10px; }
  button { border:none; border-radius:12px; padding:12px 20px; font-size:16px; font-weight:600; }
  .primary { background:#b91c1c; color:#fff; }
  .ghost { background:transparent; color:#b91c1c; }
  #msg { margin-top:10px; color:#6b7280; min-height:1.2em; }
</style>
</head><body>
<div id="target"></div>
<div class="row">
  <button class="primary" onclick="startQuiz()">✍️ Practice</button>
  <button class="ghost" onclick="writer && writer.animateCharacter()">▶ Animate</button>
</div>
<p id="msg"></p>
<script src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js"
        onerror="document.getElementById('msg').textContent='Needs internet to load stroke data.'"></script>
<script>
  let writer = null;
  if (window.HanziWriter) {
    writer = HanziWriter.create('target', ${JSON.stringify(c.char)}, {
      width: 280, height: 280, padding: 12,
      showCharacter: false, showOutline: true,
      strokeColor: '#1f2937', outlineColor: '#e5e7eb', drawingColor: '#b91c1c',
    });
  }
  function startQuiz() {
    if (!writer) return;
    document.getElementById('msg').textContent = '';
    writer.quiz({ onComplete: () => { document.getElementById('msg').textContent = '✅ Perfect!'; } });
  }
</script>
</body></html>`,
    [c.char]
  );

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setIndex((index - 1 + CHARACTERS.length) % CHARACTERS.length)}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.current}>
          <Text style={styles.currentChar}>{c.char}</Text>
          <Text style={styles.currentInfo}>
            {c.pinyin} — {c.meaning}
          </Text>
        </View>
        <TouchableOpacity style={styles.navBtn} onPress={() => setIndex((index + 1) % CHARACTERS.length)}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>
      <WebView source={{ html }} style={styles.webview} originWhitelist={['*']} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  navBtn: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: { fontSize: 24, color: colors.ink },
  current: { alignItems: 'center' },
  currentChar: { fontSize: 32, color: colors.ink },
  currentInfo: { fontSize: 13, color: colors.muted },
  webview: { flex: 1, backgroundColor: colors.bg },
});
