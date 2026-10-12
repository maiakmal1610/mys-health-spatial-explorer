import json
import re
import csv
import duckdb

# 1. Load GeoJSON features from ADM2
geojson_path = "C:/Users/DataMicron/Desktop/kri/data/boundaries/geoBoundaries-MYS-ADM2.geojson"
with open(geojson_path, "r", encoding="utf-8") as f:
    geojson_data = json.load(f)

geojson_districts = {}
for feat in geojson_data["features"]:
    name = feat["properties"].get("shapeName", "").strip()
    if name:
        geojson_districts[name.lower()] = name

# 2. Query distinct (state, district, latest_beds) from hospital_beds.parquet
con = duckdb.connect()
beds_url = "https://storage.data.gov.my/healthcare/hospital_beds.parquet"
query = """
    SELECT state, district, sum(beds) as total_beds
    FROM read_parquet(?)
    WHERE date = (SELECT max(date) FROM read_parquet(?))
      AND district NOT IN ('All', 'All Districts', 'Malaysia')
      AND type = 'all'
    GROUP BY state, district
    ORDER BY state, district
"""
parquet_rows = con.execute(query, [beds_url, beds_url]).fetchall()

# 3. Aliases dictionary
ALIASES = {
    "batang padang (tapah)": "Batang Padang",
    "gombak (rawang)": "Gombak",
    "hulu langat (bangi)": "Ulu Langat",
    "hulu langat": "Ulu Langat",
    "hulu selangor": "Ulu Selangor",
    "kinta (ipoh)": "Kinta",
    "kota penyu": "Kuala Penyu",
    "larut & matang (taiping)": "Larut dan Matang",
    "larut dan matang": "Larut dan Matang",
    "manjung (sitiawan)": "Manjung",
    "meradong": "Maradong",
    "nabawan": "Nabawan / Persiangan",
    "petaling (subang jaya)": "Petaling",
    "seberang perai utara (butterworth)": "Seberang Perai Utara",
    "timur laut (georgetown)": "Timur Laut",
    "tongad": "Tongod",
    "w.p. kuala lumpur": "Kuala Lumpur",
    "w.p. labuan": "Labuan",
    "w.p. putrajaya": "Sepang",
}

def normalize_district(raw_name):
    # Strip town in parentheses
    cleaned = re.sub(r"\s*\([^)]*\)", "", raw_name).strip()
    lower_c = cleaned.lower()
    
    # Check alias
    if raw_name.lower() in ALIASES:
        return ALIASES[raw_name.lower()]
    if lower_c in ALIASES:
        return ALIASES[lower_c]
    
    # Replace & with dan
    cleaned = cleaned.replace(" & ", " dan ")
    # Replace Hulu with Ulu
    if cleaned.lower().startswith("hulu "):
        alt = "Ulu " + cleaned[5:]
        if alt.lower() in geojson_districts:
            return geojson_districts[alt.lower()]

    if cleaned.lower() in geojson_districts:
        return geojson_districts[cleaned.lower()]
    
    return cleaned

output_csv = "C:/Users/DataMicron/Desktop/kri/data/district_matching_verification.csv"
matched_count = 0
total_count = len(parquet_rows)

with open(output_csv, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["state", "raw_parquet_district", "normalized_district", "matched_geojson_shapeName", "status", "beds_2024"])
    
    for state, raw_dist, beds in parquet_rows:
        norm_dist = normalize_district(raw_dist)
        matched_geo = geojson_districts.get(norm_dist.lower(), "")
        status = "MATCHED" if matched_geo else "UNMATCHED"
        if status == "MATCHED":
            matched_count += 1
        writer.writerow([state, raw_dist, norm_dist, matched_geo, status, beds])

print(f"Generated verification CSV at: {output_csv}")
print(f"Match summary: {matched_count} / {total_count} matched ({matched_count/total_count*100:.1f}%)")
