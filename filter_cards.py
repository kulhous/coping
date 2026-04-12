import json
import pandas as pd
import re

# Load JSON
with open('web/data/kids_cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

# Load Excel
df = pd.read_excel('/Users/vojta/Library/CloudStorage/OneDrive-HewlettPackardEnterprise/projects/Coping/coping_methods_database.xlsx')
excel_ids = set([str(x).upper() for x in df['ID'].tolist()])

# Load MD
with open('Coping Skills for Youth Distress.md', 'r', encoding='utf-8') as f:
    md_content = f.read()

# The MD contains tables with names in bold.
# E.g. | **Krabicové dýchání** (Box Breathing) | 9 | ...
# Let's map these names to kids_cards.json
md_names_cs = []
for line in md_content.split('\n'):
    if line.startswith('| **'):
        match = re.search(r'\|\s*\*\*(.*?)\*\*', line)
        if match:
            md_names_cs.append(match.group(1).strip().lower())

# Check each card
keep_cards = []
remove_cards = []

for card in cards:
    cid = card['id'].upper()
    c_name_cs = card.get('nickname', '').lower()
    
    in_excel = cid in excel_ids
    # For matching MD, we check if the card's nickname is in the MD names
    in_md = False
    for md_name in md_names_cs:
        if c_name_cs in md_name or md_name in c_name_cs:
            in_md = True
            break
            
    if in_excel or in_md:
        keep_cards.append(card)
    else:
        # Some standard cards might have been named slightly differently, let's also check related
        related = card.get('related', [])
        rel_in_excel = any(r.upper() in excel_ids for r in related)
        if rel_in_excel and not card['id'].isalpha() and not card['id'].isalnum(): # wait id is alnum
            pass # just a placeholder
            
        # The user wants exact match. The 11 special cards have ids like 'repa', 'motylek'. 
        # Standard cards have ids like 'B01', 'B13'.
        if rel_in_excel and len(card['id']) <= 3:
            keep_cards.append(card)
        else:
            remove_cards.append(card)

print("Keeping:", len(keep_cards))
print("Removing:", len(remove_cards))
print("Removed IDs:", [c['id'] for c in remove_cards])

# If we just keep the ones that have ID matching Excel OR they have ID format like B01 (standard cards)?
# Actually, the user says: "chci aby vsechny metody odpovidali tem z coping_methods_database.xlsx a v Coping Skills for Youth Distress.md zadne jine."
