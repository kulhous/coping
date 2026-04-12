import pandas as pd
import re

with open('Coping Skills for Youth Distress.md', 'r') as f:
    md_content = f.read()

# Extract names from MD tables
md_names = []
for line in md_content.split('\n'):
    if line.startswith('| **'):
        match = re.search(r'\|\s*\*\*(.*?)\*\*', line)
        if match:
            md_names.append(match.group(1))

print("MD count:", len(md_names))

# Excel
df = pd.read_excel('/Users/vojta/Library/CloudStorage/OneDrive-HewlettPackardEnterprise/projects/Coping/coping_methods_database.xlsx')
excel_names = df['Name (Card Title)'].tolist()
excel_ids = df['ID'].tolist()
print("Excel count:", len(excel_names))

# metody_pro_deti
with open('metody_pro_deti.md', 'r') as f:
    mpd_content = f.read()
mpd_items = re.findall(r'# (.*?) \((.*?)\)', mpd_content)
print("MPD count:", len(mpd_items))

# Let's find out which ones in MD are in MPD
mpd_dict = {name_cs: id for name_en, id in mpd_items for name_cs in [re.search(r'\*\*(.*?)\*\*', mpd_content.split(f'# {name_en} ({id})')[1]).group(1) if re.search(r'\*\*(.*?)\*\*', mpd_content.split(f'# {name_en} ({id})')[1]) else name_en]}

# Let's just print the raw mappings to see
for md_name in md_names:
    print(md_name)
