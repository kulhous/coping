import pandas as pd

df = pd.read_excel('/Users/vojta/Library/CloudStorage/OneDrive-HewlettPackardEnterprise/projects/Coping/coping_methods_database.xlsx')
print(df[['id', 'nickname_cs', 'name_cs']].to_string())
