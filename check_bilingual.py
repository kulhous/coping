import json
with open('web/data/methods_bilingual.json', 'r', encoding='utf-8') as f:
    methods = json.load(f)
ids = [m.get('id', m.get('ID', '')).lower() for m in methods]
print("repa in bilingual:", 'repa' in ids)
