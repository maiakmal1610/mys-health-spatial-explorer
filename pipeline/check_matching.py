import json
import duckdb

# 1. Load GeoJSON district names
geojson_path = "C:/Users/DataMicron/Desktop/kri/data/boundaries/geoBoundaries-MYS-ADM2.geojson"
with open(geojson_path, "r", encoding="utf-8") as f:
    geojson_data = json.load(f)

geojson_districts = set()
for feat in geojson_data["features"]:
    name = feat["properties"].get("shapeName", "").strip()
    if name:
        geojson_districts.add(name)

print(f"Total GeoJSON ADM2 districts: {len(geojson_districts)}")

# 2. Query Parquet district names via DuckDB
con = duckdb.connect()
beds_url = "https://storage.data.gov.my/healthcare/hospital_beds.parquet"
query = """
    SELECT DISTINCT trim(district) as district
    FROM read_parquet(?)
    WHERE district NOT IN ('All', 'All Districts', 'Malaysia')
    ORDER BY district
"""
parquet_districts = {row[0] for row in con.execute(query, [beds_url]).fetchall() if row[0]}
print(f"Total Parquet districts: {len(parquet_districts)}")

# 3. Direct Matches
direct_matches = geojson_districts.intersection(parquet_districts)
print(f"\nDirect exact matches: {len(direct_matches)} / {len(parquet_districts)}")

# 4. Mismatches
in_parquet_not_geojson = sorted(parquet_districts - geojson_districts)
in_geojson_not_parquet = sorted(geojson_districts - parquet_districts)

print(f"\n--- In Parquet but not exact match in GeoJSON ({len(in_parquet_not_geojson)}) ---")
for d in in_parquet_not_geojson:
    print(f"  Parquet: {d}")

print(f"\n--- In GeoJSON but not exact match in Parquet ({len(in_geojson_not_parquet)}) ---")
for d in in_geojson_not_parquet:
    print(f"  GeoJSON: {d}")
