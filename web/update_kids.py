import json

def generate_auto_card(method_id, method, kids_card):
    # cs
    cs = method['cs']
    kid_name = cs.get('Name (Child-friendly)') or cs.get('Name (Professional)', '')
    state = cs.get('Target Emotional State(s)', '')
    objs = cs.get('Required Objects', 'Nic')
    mech = cs.get('Brief Mechanism', '')
    adv = cs.get('Setting Constraints', '')
    
    body_cs_part = kids_card['body_cs'].split('Jak na to?\n')[1].split('Pomůže ti to')[0].strip() if 'Jak na to?' in kids_card['body_cs'] else mech
    
    body_cs = f"""**{kid_name}**

Zkus to, když cítíš: {state.lower()}. Budou se ti k tomu hodit tyto věci: {objs}.

{body_cs_part}

Tohle ti pomůže, protože {mech.lower() if mech else ''} Můžeš to dělat {adv.lower() if adv else 'kdekoliv'}.

Když ti to nepomůže, vůbec se neboj vyhledat pomoc dospělého, kterému věříš, nebo zavolat na Linku bezpečí."""

    # en
    en = method['en']
    kid_name_en = en.get('Name (Child-friendly)') or en.get('Name (Professional)', '')
    state_en = en.get('Target Emotional State(s)', '')
    objs_en = en.get('Required Objects', 'Nothing')
    mech_en = en.get('Brief Mechanism', '')
    adv_en = en.get('Setting Constraints', '')

    body_en_part = kids_card['body_en'].split('How it works:\n')[1].split('This is great')[0].strip() if 'How it works:\n' in kids_card['body_en'] else mech_en
    
    body_en = f"""**{kid_name_en}**

Try this when you're feeling: {state_en.lower()}. You'll need: {objs_en}.

{body_en_part}

This works because {mech_en.lower() if mech_en else ''} You can do this {adv_en.lower() if adv_en else 'anywhere'}.

If this doesn't help you, please don't hesitate to reach out to a trusted adult or a helpline."""

    return body_cs, body_en

def main():
    with open('data/methods_bilingual.json', 'r', encoding='utf-8') as f:
        methods = {m['id']: m for m in json.load(f)}

    with open('data/kids_cards.json', 'r', encoding='utf-8') as f:
        cards = json.load(f)

    # Hand-crafted updates for the 11 custom cards
    custom_updates = {}

    for c in cards:
        cid = c['id']
        
        if cid in custom_updates:
            c['body_cs'] = custom_updates[cid]['cs']
            c['body_en'] = custom_updates[cid]['en']
        else:
            # Auto-generated
            related = c.get('related', [])
            if related:
                meth = methods.get(related[0])
                if meth:
                    b_cs, b_en = generate_auto_card(related[0], meth, c)
                    c['body_cs'] = b_cs
                    c['body_en'] = b_en

    with open('data/kids_cards.json', 'w', encoding='utf-8') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    main()