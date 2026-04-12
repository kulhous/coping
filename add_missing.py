import json

with open('web/data/kids_cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)
    
kids_ids = {c['id'].upper() for c in cards}

with open('web/data/methods_bilingual.json', 'r', encoding='utf-8') as f:
    methods_bilingual = {m.get('id', m.get('ID')).upper(): m for m in json.load(f)}

missing_ids = ['B01', 'B02', 'B04', 'B07', 'SA01', 'SA02']

colors = ['#f2bfab', '#ddd5ea', '#cce8e8', '#f5d0d8', '#c5e6d0', '#d8cfe6'] # reuse some nice colors
c_idx = 0

for mid in missing_ids:
    meta = methods_bilingual[mid]
    cs_meta = meta.get('cs', {})
    en_meta = meta.get('en', {})
    
    nickname = cs_meta.get('Name (Child-friendly)') or cs_meta.get('Name (Professional)', '')
    nickname_en = en_meta.get('Name (Child-friendly)') or en_meta.get('Name (Professional)', '')
    
    new_card = {
        'id': mid.lower(),
        'nickname': nickname,
        'nickname_en': nickname_en,
        'color': colors[c_idx % len(colors)],
        'related': [mid],
        'headline_cs': '',
        'headline_en': '',
        'body_cs': '',
        'body_en': ''
    }
    cards.append(new_card)
    c_idx += 1

with open('web/data/kids_cards.json', 'w', encoding='utf-8') as f:
    json.dump(cards, f, indent=2, ensure_ascii=False)

print("Added 6 missing cards.")
