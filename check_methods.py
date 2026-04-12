import json
import pandas as pd

with open('web/data/kids_cards.json') as f:
    kids = json.load(f)
    kids_ids = [d['id'] for d in kids]

df = pd.read_excel('/Users/vojta/Library/CloudStorage/OneDrive-HewlettPackardEnterprise/projects/Coping/coping_methods_database.xlsx')
excel_ids = [str(x).lower() for x in df['ID'].tolist()]

print("Kids IDs:", kids_ids)
print("Excel IDs:", excel_ids)
print("Kids NOT in Excel:", [x for x in kids_ids if x not in excel_ids])
