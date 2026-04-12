import pandas as pd
df = pd.read_excel('/Users/vojta/Library/CloudStorage/OneDrive-HewlettPackardEnterprise/projects/Coping/coping_methods_database.xlsx')
print(df[df['Name (Card Title)'].str.contains('Smile', case=False, na=False)][['ID', 'Name (Card Title)']])
