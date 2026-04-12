import json
import os

def update_headlines():
    filepath = 'web/data/kids_cards.json'
    with open(filepath, 'r', encoding='utf-8') as f:
        cards = json.load(f)

    # Mapping old headlines to new empathetic ones
    headline_map_cs = {
        # The new requested ones
        "😟 Mám úzkost": "Je toho na mě moc.",
        "😰 Mám strach": "Bojím se.",
        "😡 Mám vztek": "Mám chuť něco rozbít.",
        "🔄 Myšlenky se točí": "Nedokážu vypnout hlavu.",
        "🌫️ Jsem mimo": "Jsem úplně mimo.",
        "😢 Je mi smutno": "Je mi hrozně smutno.",
        "😳 Stydím se": "Nejradši bych se propadl/a.",
        "💔 Chci si ublížit": "Mám chuť si ublížit.",

        # Normalizing the older ones (some of these are from the first 10 custom cards)
        "Vzkazy na těle.": "Mám chuť si ublížit.",
        "Chci si ublížit.": "Mám chuť si ublížit.",
        "Hned vybuchnu.": "Mám chuť něco rozbít.",
        "Je mi smutno.": "Je mi hrozně smutno.",
        "Myšlenky se mi honí hlavou.": "Nedokážu vypnout hlavu.",
        "Nedokážu vypnout hlavu.": "Nedokážu vypnout hlavu.",
        "Necítím vlastní tělo.": "Jsem úplně mimo.",
        "Cítím zmatek.": "Je toho na mě moc.",
        "Nevím, co cítím.": "Jsem úplně mimo.",
        "Všechno se hroutí.": "Bojím se.",

        # English to Czech fallbacks (if any sneaked in)
        "Any emotional state.": "Je toho na mě moc.",
        "Overwhelm, sensory overload indoors.": "Je toho na mě moc.",

        # Missing from the prompt but present in the JSON
        "📚 Stres ze školy": "Je toho na mě moc.",
        "😴 Nemůžu spát": "Nedokážu vypnout hlavu.",
        "🫂 Jsem sám/sama": "Je mi hrozně smutno.",
        "Chci být připravený/á.": "Chci být připravený/á." # Keeping this one as is, it's specific
    }

    headline_map_en = {
        # Corresponding english updates just so they match the tone if needed,
        # but I will mostly just map the Czech ones as requested.
        # Let's keep EN roughly same meaning but empathetic tone.
        "😟 Anxiety": "It's all too much.",
        "😰 Panic": "I'm scared.",
        "😡 Anger": "I want to break something.",
        "🔄 Thoughts won't stop": "I can't turn off my head.",
        "🌫️ Spaced out": "I'm completely spaced out.",
        "😢 Sadness": "I feel so incredibly sad.",
        "😳 Shame": "I just want to disappear.",
        "💔 Urge to self-harm": "I want to hurt myself.",
        
        "Messages on the body.": "I want to hurt myself.",
        "I want to hurt myself.": "I want to hurt myself.",
        "I’m about to explode.": "I want to break something.",
        "I feel sad.": "I feel so incredibly sad.",
        "My thoughts won’t stop racing.": "I can't turn off my head.",
        "I can’t turn off my head.": "I can't turn off my head.",
        "I can’t feel my own body.": "I'm completely spaced out.",
        "I’m totally spaced out.": "I'm completely spaced out.",
        "I don’t know what I feel.": "I'm completely spaced out.",
        "Everything is falling apart.": "I'm scared.",
        
        "Any emotional state.": "It's all too much.",
        "Overwhelm, sensory overload indoors.": "It's all too much.",
        
        "📚 School stress": "It's all too much.",
        "😴 Can't sleep": "I can't turn off my head.",
        "🫂 Lonely": "I feel so incredibly sad.",
        "I want to be prepared.": "I want to be prepared."
    }

    count = 0
    for card in cards:
        old_cs = card.get('headline_cs', '')
        if old_cs in headline_map_cs:
            card['headline_cs'] = headline_map_cs[old_cs]
            count += 1
            
        old_en = card.get('headline_en', '')
        if old_en in headline_map_en:
            card['headline_en'] = headline_map_en[old_en]

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)
        
    print(f"Updated {count} cards.")

if __name__ == '__main__':
    update_headlines()