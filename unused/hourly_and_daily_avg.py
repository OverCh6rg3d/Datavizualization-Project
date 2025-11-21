import pandas as pd
from datetime import datetime

# Load raw accidents CSV
df = pd.read_csv("data/accidents.csv")

# Parse datetime
df["acci_time"] = pd.to_datetime(df["acci_time"], format="%d/%m/%Y %H:%M")

# Extract date and hour
df["date"] = df["acci_time"].dt.date
df["hour"] = df["acci_time"].dt.hour

# 1. Compute daily counts per community
daily = (
    df
    .groupby(["Community", "date"])
    .size()
    .reset_index(name="count")
)

# Then compute average per day per community
avg_daily = (
    daily
    .groupby("Community")["count"]
    .mean()
    .reset_index(name="avg_per_day")
)

# 2. Compute hourly average per community
hourly = (
    df
    .groupby(["Community", "hour"])
    .size()
    .reset_index(name="count_hour")
)

# For hourly average: divide by number of distinct days per community
days_per_comm = daily.groupby("Community")["date"].nunique().reset_index(name="num_days")

hourly = hourly.merge(days_per_comm, on="Community")
hourly["avg_per_hour"] = hourly["count_hour"] / hourly["num_days"]

hourly = hourly[["Community", "hour", "avg_per_hour"]]

# Save to CSVs
avg_daily.to_csv("avg_daily.csv", index=False)
hourly.to_csv("hourly_avg.csv", index=False)
