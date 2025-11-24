import pandas as pd
import json

# ---- INPUT FILES ----
csv_file = "C:/Users/aliei/OneDrive/Documents/Uni/yr3/Data Visualization/Proj/deliv3/data/community_population_density.csv"
geojson_file = "C:/Users/aliei/OneDrive/Documents/Uni/yr3/Data Visualization/Proj/deliv3/data/dubai_neighborhoods.geojson"
output_file = "community_population_density.csv"

# ---- LOAD CSV ----
df = pd.read_csv(csv_file)

# Normalize community name column in CSV
df["Name"] = df["Name"].str.strip().str.upper()

# ---- LOAD GEOJSON ----
with open(geojson_file, "r", encoding="utf-8") as f:
    geo = json.load(f)

# Build dictionary: {CNAME_E: area_km}
area_map = {}
for feature in geo["features"]:
    props = feature.get("properties", {})
    cname = props.get("CNAME_E", "").strip().upper()
    area = props.get("Area Sq Km", None)
    if cname and area is not None:
        area_map[cname] = area

# ---- MAP AREA TO CSV ----
df["Area"] = df["Name"].map(area_map)

# ---- SAVE OUTPUT ----
df.to_csv(output_file, index=False)

print("Done! Saved:", output_file)
missing = df[df["Area"].isna()]
if not missing.empty:
    print("\nWARNING: Some communities were not matched:")
    print(missing["Name"].tolist())
