import json
import re
import sys

def parse_metody_pro_deti():
    with open('metody_pro_deti.md', 'r', encoding='utf-8') as f:
        content = f.read()

    methods = {}
    
    # Split by headings: # Title (ID)
    pattern = re.compile(r'#\s+.*?\((.*?)\)\n(.*?)(?=\n#|$)', re.DOTALL)
    for match in pattern.finditer(content):
        method_id = match.group(1).strip()
        body = match.group(2).strip()
        methods[method_id] = body

    return methods

custom_updates_cs = {}

def main():
    methods = parse_metody_pro_deti()

    # also update the source of truth `kids_cards.json`
    with open('web/data/kids_cards.json', 'r', encoding='utf-8') as f:
        cards = json.load(f)
    
    with open('web/data/methods_bilingual.json', 'r', encoding='utf-8') as f:
        method_meta = {m['id']: m for m in json.load(f)}

    for c in cards:
        cid = c['id']
        
        if cid in custom_updates_cs:
            c['body_cs'] = custom_updates_cs[cid]
        else:
            related = c.get('related', [])
            if related:
                rel_id = related[0]
                if rel_id in methods:
                    # we will prefix the name of the method as bold like in the existing cards
                    meth_data = method_meta.get(rel_id, {})
                    cs_meta = meth_data.get('cs', {})
                    kid_name = cs_meta.get('Name (Child-friendly)') or cs_meta.get('Name (Professional)', '')
                    
                    body_text = methods[rel_id]
                    # ensure we keep the title bold format: **Name**\n\nbody
                    c['body_cs'] = f"**{kid_name}**\n\n{body_text}"

    with open('web/data/kids_cards.json', 'w', encoding='utf-8') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    main()
