import json

custom_objects = {
    "repa": {
        "cs": "Zavařená řepa, formička na led a voda",
        "en": "Preserved beetroot, ice-cube tray, water"
    },
    "ledovka": {
        "cs": "Studená voda, zmrzlý sáček s čímkoliv, nebo mokrý ručník",
        "en": "Cold tap water, a frozen bag of anything, or a very wet towel"
    },
    "pastelky": {
        "cs": "Papír a pastelky nebo fixy",
        "en": "Paper and crayons or markers"
    },
    "klubicko": {
        "cs": "Nic (nebo těžká deka)",
        "en": "Nothing (or a heavy blanket)"
    },
    "dennicek": {
        "cs": "Papír a propiska, nebo mobil",
        "en": "Paper and pen, or a phone"
    },
    "krabicka": {
        "cs": "Krabice nebo taštička a oblíbené věci (krém, kamínek...)",
        "en": "Box or pouch and favorite comforting items"
    }
}

def main():
    with open('web/data/kids_cards.json', 'r', encoding='utf-8') as f:
        cards = json.load(f)
    
    for c in cards:
        if c['id'] in custom_objects:
            c['objects_cs'] = custom_objects[c['id']]['cs']
            c['objects_en'] = custom_objects[c['id']]['en']

    with open('web/data/kids_cards.json', 'w', encoding='utf-8') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    main()
