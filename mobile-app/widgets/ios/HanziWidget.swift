// Home-screen widget showing the Chinese character of the day.
// The widget computes the daily character deterministically from the date
// (day-of-year modulo dataset size), matching the logic used inside the app,
// so no app↔widget data bridge is needed.

import WidgetKit
import SwiftUI

struct HanziEntry: TimelineEntry {
    let date: Date
    let character: HanziCharacter
}

func characterFor(date: Date) -> HanziCharacter {
    let dayOfYear = Calendar.current.ordinality(of: .day, in: .year, for: date) ?? 1
    return hanziCharacters[dayOfYear % hanziCharacters.count]
}

struct HanziProvider: TimelineProvider {
    func placeholder(in context: Context) -> HanziEntry {
        HanziEntry(date: Date(), character: characterFor(date: Date()))
    }

    func getSnapshot(in context: Context, completion: @escaping (HanziEntry) -> Void) {
        completion(HanziEntry(date: Date(), character: characterFor(date: Date())))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HanziEntry>) -> Void) {
        // One entry per day for the next week; the system refreshes after that.
        var entries: [HanziEntry] = []
        let calendar = Calendar.current
        let startOfToday = calendar.startOfDay(for: Date())
        for offset in 0..<7 {
            if let date = calendar.date(byAdding: .day, value: offset, to: startOfToday) {
                entries.append(HanziEntry(date: date, character: characterFor(date: date)))
            }
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

struct HanziWidgetView: View {
    var entry: HanziEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(spacing: 2) {
            Text(entry.character.char)
                .font(.system(size: family == .systemSmall ? 56 : 72))
                .minimumScaleFactor(0.5)
            Text(entry.character.pinyin)
                .font(.headline)
                .foregroundColor(Color(red: 0.98, green: 0.85, blue: 0.55))
            Text(entry.character.meaning)
                .font(.caption)
                .lineLimit(1)
            if family != .systemSmall {
                Text("\(entry.character.example) (\(entry.character.examplePinyin)) — \(entry.character.exampleMeaning)")
                    .font(.caption2)
                    .opacity(0.85)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .padding(.top, 2)
            }
        }
        .foregroundColor(.white)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .containerBackground(for: .widget) {
            Color(red: 0.725, green: 0.11, blue: 0.11)
        }
    }
}

struct HanziWidget: Widget {
    let kind: String = "HanziWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HanziProvider()) { entry in
            HanziWidgetView(entry: entry)
        }
        .configurationDisplayName("Character of the Day")
        .description("Learn one new Chinese character every day.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct HanziWidgetBundle: WidgetBundle {
    var body: some Widget {
        HanziWidget()
    }
}
