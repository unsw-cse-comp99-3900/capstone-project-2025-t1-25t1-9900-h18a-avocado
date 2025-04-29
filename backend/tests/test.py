import xarray as xr
import xclim.indices as xc
import glob
from xclim.indices.stats import standardized_index_fit_params

# -----------------------------------------------------------------------------
# setup parameters
# -----------------------------------------------------------------------------
# drought_threshold (SPI < -1.0 represents drought)
drought_threshold = -1.0

# select emission scenario: "ssp126" or "ssp370"
scenario = "ssp126"

# -----------------------------------------------------------------------------
# read data
# -----------------------------------------------------------------------------
# read historical data (1951-2014)
historical_files = sorted(glob.glob("CMIP6/historical/*.nc"))
ds_historical = xr.open_mfdataset(historical_files, combine="by_coords")

# read future data (2015-2099)
scenario_files = sorted(glob.glob(f"CMIP6/{scenario}/*.nc"))
ds_scenario = xr.open_mfdataset(scenario_files, combine="by_coords")

# combine datasets along the time dimension
ds = xr.concat([ds_historical, ds_scenario], dim="time")

# -----------------------------------------------------------------------------
# select precipitation variable and convert units (kg/m²/s → mm/day)
pr = ds["pr"] * 86400
pr.attrs["units"] = "mm/day"

# optimized chunking: ensure time dimension is a single chunk, lat and lon are chunked every 100 grids
pr = pr.chunk({"time": -1, "lat": 100, "lon": 100})

# -----------------------------------------------------------------------------
# setup calibration period (1980-2019) and future periods
cal_start = "1980-01-01"
cal_end = "2019-12-31"

future_periods = {
    "near-term": ("2020-01-01", "2059-12-31"),
    "mid-century": ("2040-01-01", "2079-12-31"),
    "late-century": ("2060-01-01", "2099-12-31"),
}

# -----------------------------------------------------------------------------
# calculate SPI-12 fitting parameters for the baseline period
print("⚙️ calculating SPI-12 fitting parameters for the baseline period...")

# select baseline data and ensure time dimension is a single chunk
pr_baseline = pr.sel(time=slice(cal_start, cal_end)).chunk({"time": -1, "lat": 100, "lon": 100}).unify_chunks()

baseline_params = standardized_index_fit_params(
    pr_baseline,
    freq="MS",
    window=12,
    dist="gamma",
    method="ML",
    zero_inflated=True  # precipitation data may contain zeros
).compute()  # calculate immediately to ensure the result is available

print("✅ baseline_params has been calculated successfully!")

# -----------------------------------------------------------------------------
# calculate SPI-12 for each future period
spi_12_future = {}
for period, (start, end) in future_periods.items():
    print(f"⚙️ calculate {period} ( {start} - {end} ) SPI-12...")
    pr_future = pr.sel(time=slice(start, end))
    spi_12_future[period] = xc.standardized_precipitation_index(
        pr_future, freq="MS", window=12, dist="gamma", method="ML", params=baseline_params
    ).compute()  # 立即计算，防止 KeyError

print("✅ the calculate of future_periods SPI-12 has been completed!")

# -----------------------------------------------------------------------------
# calculate 10-year statistics
spi_12_decade = {}
drought_months_decade = {}
drought_length_decade = {}

for period in future_periods.keys():
    print(f"⚙️ calculating {period} SPI-12 decade statistics...")

    # calculating 10-year mean
    spi_12_decade[period] = spi_12_future[period].groupby(spi_12_future[period].time.dt.year // 10).mean(dim="time")

    # calculate the number of drought months (SPI < drought_threshold) in each decade
    drought_months_decade[period] = (spi_12_decade[period] < drought_threshold).sum(dim="time")

    # calculate the number of drought months (SPI < drought_threshold) in each decade, binary SPI is grouped by year and summed
    drought_length_decade[period] = (spi_12_future[period] < drought_threshold).astype(int).groupby(spi_12_future[period].time.dt.year // 10).sum(dim="time")

print("✅ the calculate of SPI-12 decade statistics has been completed!")
