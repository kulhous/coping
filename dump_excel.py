import pandas as pd

df = pd.read_excel('/Users/vojta/Library/CloudStorage/OneDrive-HewlettPackardEnterprise/projects/Coping/coping_methods_database.xlsx')
for index, row in df.iterrows():
    print(f"{row['ID']}: {row['Name (Card Title)']}")
