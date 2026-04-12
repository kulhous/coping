import json

with open('web/data/kids_cards.json', 'r', encoding='utf-8') as f:
    kids_cards = json.load(f)
kids_ids = {c['id'].upper() for c in kids_cards}

with open('web/data/methods_bilingual.json', 'r', encoding='utf-8') as f:
    methods_bilingual = json.load(f)
mb_ids = {c.get('id', c.get('ID')).upper() for c in methods_bilingual}

print("Missing from kids_cards.json:", sorted(list(mb_ids - kids_ids)))
