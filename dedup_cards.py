import json

with open('web/data/kids_cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

seen = set()
dedup_cards = []
for c in cards:
    if c['id'] not in seen:
        seen.add(c['id'])
        dedup_cards.append(c)

with open('web/data/kids_cards.json', 'w', encoding='utf-8') as f:
    json.dump(dedup_cards, f, indent=2, ensure_ascii=False)

print(f"Removed {len(cards) - len(dedup_cards)} duplicates.")
