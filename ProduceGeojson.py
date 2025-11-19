import pandas as pd
import geopandas
from shapely.geometry import Point

# --- 1. Load Data ---
accidents_df = pd.read_csv('accidents.csv')
communities_gdf = geopandas.read_file('dubai_neighborhoods.geojson')

# --- 2. Prepare the Geometry
geometry = [
    Point(xy) 
    for xy in zip(accidents_df['acci_y'], accidents_df['acci_x'])
]

# Create an accident GeoDataFrame (CRS: EPSG:4326 is standard for WGS84 lat/lon)
accidents_gdf = geopandas.GeoDataFrame(accidents_df, geometry=geometry, crs="EPSG:4326")

# Ensure both GeoDataFrames have the same CRS
communities_gdf = communities_gdf.to_crs(accidents_gdf.crs)

# --- 3. Perform the Spatial Join ---
joined_data = geopandas.sjoin(
    left_df=accidents_gdf, 
    right_df=communities_gdf[['CNAME_E', 'geometry']], 
    how='left', 
    predicate='within'
)

# --- 4. Finalize the Data ---
final_df = joined_data[[
    'acci_id', 
    'acci_time', 
    'acci_name', 
    'acci_x', 
    'acci_y', 
    'CNAME_E'
]].rename(columns={'CNAME_E': 'Community'})

final_df['Community'] = final_df['Community'].fillna('Unspecified')

final_df.to_csv('accidents_with_community.csv', index=False)

print("Spatial join completed.")