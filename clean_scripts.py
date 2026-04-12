import re

with open('update_web.py', 'r', encoding='utf-8') as f:
    text = f.read()
# Find custom_updates_cs = { ... }
text = re.sub(r'custom_updates_cs\s*=\s*\{.*?\n\}\n\n', 'custom_updates_cs = {}\n\n', text, flags=re.DOTALL)
with open('update_web.py', 'w', encoding='utf-8') as f:
    f.write(text)

with open('web/update_kids.py', 'r', encoding='utf-8') as f:
    text = f.read()
text = re.sub(r'custom_updates\s*=\s*\{.*?\n\s{4}\}\n\n', 'custom_updates = {}\n\n', text, flags=re.DOTALL)
with open('web/update_kids.py', 'w', encoding='utf-8') as f:
    f.write(text)

