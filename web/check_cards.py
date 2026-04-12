import json

with open("data/kids_cards.json") as f:
    cards = json.load(f)

for c in cards:
    print(c["id"], c.get("related", []))
