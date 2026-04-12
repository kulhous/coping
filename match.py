import pandas as pd
import re

df = pd.read_excel('/Users/vojta/Library/CloudStorage/OneDrive-HewlettPackardEnterprise/projects/Coping/coping_methods_database.xlsx')
excel_ids = [str(x).upper() for x in df['ID'].tolist()]

with open('Coping Skills for Youth Distress.md', 'r') as f:
    md_lines = f.readlines()

md_names_cs = []
for line in md_lines:
    if '| **' in line:
        name = line.split('|')[1].strip().replace('**', '')
        # extract the czech part (before the parenthesis)
        cs_name = name.split('(')[0].strip()
        md_names_cs.append(cs_name)

with open('metody_pro_deti.md', 'r') as f:
    mpd_content = f.read()

mpd_blocks = mpd_content.split('\n# ')
mpd_map = {}
for block in mpd_blocks[1:]:
    header = block.split('\n')[0]
    m = re.search(r'^(.*?) \((.*?)\)$', header)
    if m:
        en_name = m.group(1).strip()
        id_str = m.group(2).strip().upper()
        # find cs name
        cs_m = re.search(r'\*\*(.*?)\*\*', block)
        cs_name = cs_m.group(1).strip() if cs_m else en_name
        mpd_map[cs_name] = id_str

md_ids = set()
for cs in md_names_cs:
    found = False
    for k, v in mpd_map.items():
        if cs.lower() in k.lower() or k.lower() in cs.lower():
            md_ids.add(v)
            found = True
            break
    if not found:
        print(f"NOT FOUND IN MPD: {cs}")

print("\nMD IDs count:", len(md_ids))
print("Excel IDs count:", len(excel_ids))
union_ids = set(excel_ids).union(md_ids)
intersection_ids = set(excel_ids).intersection(md_ids)

print("In both:", len(intersection_ids))
print("Only in MD:", md_ids - set(excel_ids))
print("Only in Excel:", set(excel_ids) - md_ids)

