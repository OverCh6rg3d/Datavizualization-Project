# prepare_weekly_data.py
import pandas as pd
from pathlib import Path

# --- Config ---
INPUT = "C:/Users/aliei/OneDrive/Documents/Uni/yr3/Data Visualization/Proj/deliv3/data/Accidents.csv"   # your raw accidents CSV
OUT_COMM_WEEK = "weekly_counts_by_community.csv"
OUT_WEEKLY_TOTAL = "weekly_total.csv"

# The date range you specified: March 6, 2024 -> Sep 25, 2024
START_DATE = pd.to_datetime("2023-03-09")   # inclusive week 1 start
END_DATE   = pd.to_datetime("2024-09-25")   # inclusive (last day)

# --- Helper: normalize community names to help joining with GeoJSON ---
def normalize_name(s):
    #cancel for now
    return s
    if pd.isna(s):
        return s
    # strip whitespace, uppercase, collapse multiple spaces
    s2 = " ".join(str(s).strip().upper().split())
    # optionally remove diacritics or punctuation here if needed
    return s2

# ---- Load raw data ----
df = pd.read_csv(INPUT, dtype=str)  # read as strings to avoid surprises
# Example columns: acci_id,acci_time,acci_name,acci_x,acci_y,Community

# --- Parse datetimes (your example format: "25/09/2024 17:43") ---
# Try common format with day/month/year hour:minute
df['acci_time_parsed'] = pd.to_datetime(df['acci_time'], format="%d/%m/%Y %H:%M", errors='coerce')

# If parsing failed for many rows, try flexible parse (slower):
if df['acci_time_parsed'].isna().sum() > 0:
    df['acci_time_parsed'] = pd.to_datetime(df['acci_time'], dayfirst=True, errors='coerce')

# Drop rows with invalid times (or keep them separately)
bad_dates = df['acci_time_parsed'].isna().sum()
print(f"Rows with unparsed acci_time: {bad_dates}")

# --- Normalize community names ---
df['Community_norm'] = df['Community'].apply(normalize_name)

# --- Compute week index relative to START_DATE ---
# We'll use weeks that start on START_DATE and then every 7 days
df['date'] = df['acci_time_parsed'].dt.floor('D')  # remove hours/minutes
# calculate week_index starting at 1
df['days_from_start'] = (df['date'] - START_DATE).dt.days
df['week_index'] = (df['days_from_start'] // 7 + 1).astype('Int64')  # nullable int
# compute week start date label
df['week_start'] = (START_DATE + pd.to_timedelta((df['week_index'] - 1).fillna(0).astype(int) * 7, unit='D'))
# Keep only rows that fall in range (1..29)
n_weeks = ((END_DATE - START_DATE).days // 7) + 1
print(f"Planned number of weeks (inclusive): {n_weeks}")  # should be 29

df = df[(df['week_index'].notna()) & (df['week_index'] >= 1) & (df['week_index'] <= n_weeks)].copy()

# --- Aggregate: counts per (Community_norm, week_index) ---
agg = (
    df.groupby(['Community_norm', 'week_index', 'week_start'], dropna=False)
      .agg(Accident_Count=('acci_id', 'count'))
      .reset_index()
)

# --- Make sure every community has every week (fill missing with 0) ---
communities = agg['Community_norm'].unique()
weeks = pd.DataFrame({
    'week_index': range(1, n_weeks + 1),
    'week_start': [START_DATE + pd.Timedelta(days=7*(i-1)) for i in range(1, n_weeks+1)]
})
full = (
    pd.MultiIndex.from_product([communities, weeks['week_index']], names=['Community_norm','week_index'])
    .to_frame(index=False)
)
# attach week_start by merging
full = full.merge(weeks, on='week_index', how='left')

full = full.merge(agg, on=['Community_norm','week_index','week_start'], how='left')
full['Accident_Count'] = full['Accident_Count'].fillna(0).astype(int)

# Rename Community_norm back to Community (but keep it normalized)
full = full.rename(columns={'Community_norm': 'Community'})

# Save file for Vega-Lite
full.to_csv(OUT_COMM_WEEK, index=False)
print(f"Wrote {OUT_COMM_WEEK}: {len(full)} rows (communities × weeks).")

# --- Also produce overall weekly totals (all communities combined) ---
weekly_total = full.groupby(['week_index','week_start'], as_index=False).agg(Accident_Count=('Accident_Count', 'sum'))
weekly_total.to_csv(OUT_WEEKLY_TOTAL, index=False)
print(f"Wrote {OUT_WEEKLY_TOTAL}: {len(weekly_total)} weeks.")

# --- Optional: save community list for debugging/mapping ---
pd.DataFrame({'Community': communities}).to_csv("communities_normalized.csv", index=False)
print("Wrote communities_normalized.csv")

# Sanity prints
print("Sample of aggregated data (first 10 rows):")
print(full.head(10).to_string(index=False))
print("Sample weekly totals:")
print(weekly_total.to_string(index=False))
