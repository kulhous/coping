import json

with open('web/data/kids_cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

with open('web/data/methods_bilingual.json', 'r', encoding='utf-8') as f:
    methods_bilingual = {m.get('id', m.get('ID')): m for m in json.load(f)}

special_ids = {'repa', 'motylek', 'ledovka', 'pastelky', 'baterka', 'klubicko', 'walkman', 'stop', 'dennicek', 'krabicka', 'treni'}

new_cards = []

for card in cards:
    cid = card['id']
    if cid in special_ids:
        # Get the related standard IDs
        related = card.get('related', [])
        for rel_id in related:
            # Create a new card for the standard method
            if rel_id not in methods_bilingual:
                print(f"Warning: {rel_id} not found in methods_bilingual")
                continue
                
            meta = methods_bilingual[rel_id]
            cs_meta = meta.get('cs', {})
            en_meta = meta.get('en', {})
            
            nickname = cs_meta.get('Name (Child-friendly)') or cs_meta.get('Name (Professional)', '')
            nickname_en = en_meta.get('Name (Child-friendly)') or en_meta.get('Name (Professional)', '')
            
            new_card = {
                'id': rel_id.lower(),
                'nickname': nickname,
                'nickname_en': nickname_en,
                'color': card['color'],
                'related': [rel_id],
                'headline_cs': card.get('headline_cs', ''),
                'headline_en': card.get('headline_en', '')
            }
            new_cards.append(new_card)
    else:
        new_cards.append(card)

# Now we need to populate body_cs and body_en using update_kids.py logic
# Actually, since update_web.py already does this for standard cards, we can just save it and run update_web.py!

with open('web/data/kids_cards.json', 'w', encoding='utf-8') as f:
    json.dump(new_cards, f, indent=2, ensure_ascii=False)

print(f"Replaced {len(special_ids)} special cards with {len(new_cards) - 44} standard cards.")
