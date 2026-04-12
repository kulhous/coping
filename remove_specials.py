import json

with open('web/data/kids_cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

special_ids = {'repa', 'motylek', 'ledovka', 'pastelky', 'baterka', 'klubicko', 'walkman', 'stop', 'dennicek', 'krabicka', 'treni'}

filtered_cards = [c for c in cards if c['id'] not in special_ids]

with open('web/data/kids_cards.json', 'w', encoding='utf-8') as f:
    json.dump(filtered_cards, f, indent=2, ensure_ascii=False)

print(f"Removed {len(cards) - len(filtered_cards)} cards. {len(filtered_cards)} cards remaining.")
