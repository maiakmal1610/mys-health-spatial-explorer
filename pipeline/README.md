# 🛠️ Data Engineering & ETL Pipeline

This directory contains the computational pipeline that queries official public cloud data sources and builds the spatial GeoJSON dataset for the **Malaysia Healthcare Equity Spatial Exploration** platform.

## 📁 Files

* **`run_pipeline.py`**: The primary pipeline script. Uses **DuckDB** to query live remote Parquet files from `data.gov.my` and `dosm.gov.my`, executes string normalization, reconciles hospital and population counts, performs a complete outer join on all 159 ADM2 boundary polygons, and generates `public/data/districts_healthcare.geojson`.
* **`check_matching.py`**: Diagnostic utility script to verify boundary feature matching rates and identify any unmapped districts.
* **`generate_matching_csv.py`**: Generates a reconciliation mapping lookup table between MoH district names, DOSM census names, and ADM2 boundary polygons.
* **`requirements.txt`**: Python dependencies (`duckdb`, `requests`).

## 🚀 Execution

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run ETL pipeline
python run_pipeline.py
```

## 🔄 Data Pipeline Logic

1. **Remote Parquet Scan**: Uses DuckDB's in-memory engine to scan remote files directly via HTTPS:
   - Hospital beds: `https://storage.data.gov.my/healthcare/hospital_beds.parquet`
   - Population: `https://storage.dosm.gov.my/population/population_district.parquet`
2. **Text Normalization**:
   - Removes hospital town parentheses (e.g. `Kinta (Ipoh)` → `Kinta`).
   - Normalizes orthographic variations (`Hulu` ↔ `Ulu`, `&` ↔ `dan`).
   - Applies deterministic alias crosswalks (e.g., `W.P. Putrajaya` → `Sepang`).
3. **Spatial Outer Join (Zero Drop)**:
   - Performs a complete outer join over all 159 ADM2 polygons.
   - Non-hospital districts (e.g., *Selama*, *Bagan Datuk*, *Muallim*, *Kuala Nerus*) are assigned `0` beds with their exact census population preserved, avoiding spatial voids or missing geometries.
