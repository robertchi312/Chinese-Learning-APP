// Home-screen widget showing the Chinese character of the day.
// Reads the bundled characters.json asset and picks an entry by
// day-of-year modulo dataset size — the same logic as the app and the
// iOS widget, so no app↔widget data bridge is needed.
//
// After `npx expo prebuild`, place this file at:
//   android/app/src/main/java/com/hanzitrainer/app/HanziWidgetProvider.kt
// (see widgets/android/README.md for the full setup)

package com.hanzitrainer.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONArray
import java.util.Calendar

class HanziWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val character = characterOfTheDay(context)
        val views = RemoteViews(context.packageName, R.layout.widget_hanzi).apply {
            setTextViewText(R.id.widget_char, character.getString("char"))
            setTextViewText(R.id.widget_pinyin, character.getString("pinyin"))
            setTextViewText(R.id.widget_meaning, character.getString("meaning"))
        }

        // Tapping the widget opens the app.
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        if (launchIntent != null) {
            val pendingIntent = PendingIntent.getActivity(
                context, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun characterOfTheDay(context: Context): org.json.JSONObject {
        val json = context.assets.open("characters.json").bufferedReader().use { it.readText() }
        val characters = JSONArray(json)
        val dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)
        return characters.getJSONObject(dayOfYear % characters.length())
    }
}
