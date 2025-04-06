import xarray as xr
import xclim.indices as xc
import glob
from xclim.indices.stats import standardized_index_fit_params

# -----------------------------------------------------------------------------
# 设定参数
# -----------------------------------------------------------------------------
# 干旱阈值（SPI < -1.0 代表干旱）
drought_threshold = -1.0

# 选择排放情景: "ssp126" 或 "ssp370"
scenario = "ssp126"

# -----------------------------------------------------------------------------
# 读取数据
# -----------------------------------------------------------------------------
# 读取历史数据 (1951-2014)
historical_files = sorted(glob.glob("CMIP6/historical/*.nc"))
ds_historical = xr.open_mfdataset(historical_files, combine="by_coords")

# 读取未来数据 (2015-2099)
scenario_files = sorted(glob.glob(f"CMIP6/{scenario}/*.nc"))
ds_scenario = xr.open_mfdataset(scenario_files, combine="by_coords")

# 合并数据集
ds = xr.concat([ds_historical, ds_scenario], dim="time")

# -----------------------------------------------------------------------------
# 选择降水变量，并转换单位（kg/m²/s → mm/day）
pr = ds["pr"] * 86400
pr.attrs["units"] = "mm/day"

# 优化 chunking：确保 time 维度为一个整体，lat 和 lon 每 100 个网格切一次
pr = pr.chunk({"time": -1, "lat": 100, "lon": 100})

# -----------------------------------------------------------------------------
# 设定基准期（1980-2019）及未来时间段
cal_start = "1980-01-01"
cal_end = "2019-12-31"

future_periods = {
    "near-term": ("2020-01-01", "2059-12-31"),
    "mid-century": ("2040-01-01", "2079-12-31"),
    "late-century": ("2060-01-01", "2099-12-31"),
}

# -----------------------------------------------------------------------------
# 计算基准期 SPI-12 拟合参数
print("⚙️ 计算基准期 SPI-12 拟合参数...")

# 选取基准期数据，并确保 time 维度统一成一个 chunk
pr_baseline = pr.sel(time=slice(cal_start, cal_end)).chunk({"time": -1, "lat": 100, "lon": 100}).unify_chunks()

baseline_params = standardized_index_fit_params(
    pr_baseline,
    freq="MS",
    window=12,
    dist="gamma",
    method="ML",
    zero_inflated=True  # 降水数据可能含有零值
).compute()  # 立刻计算，确保结果可用

print("✅ 基准期参数计算完成！")

# -----------------------------------------------------------------------------
# 计算未来每个时间段的 SPI-12
spi_12_future = {}
for period, (start, end) in future_periods.items():
    print(f"⚙️ 计算 {period} ( {start} - {end} ) SPI-12...")
    pr_future = pr.sel(time=slice(start, end))
    spi_12_future[period] = xc.standardized_precipitation_index(
        pr_future, freq="MS", window=12, dist="gamma", method="ML", params=baseline_params
    ).compute()  # 立即计算，防止 KeyError

print("✅ 未来 SPI-12 计算完成！")

# -----------------------------------------------------------------------------
# 计算 10 年期统计
spi_12_decade = {}
drought_months_decade = {}
drought_length_decade = {}

for period in future_periods.keys():
    print(f"⚙️ 计算 {period} 的 10 年期统计...")

    # 计算 10 年期均值
    spi_12_decade[period] = spi_12_future[period].groupby(spi_12_future[period].time.dt.year // 10).mean(dim="time")

    # 计算每 10 年内干旱月份数（SPI < drought_threshold）
    drought_months_decade[period] = (spi_12_decade[period] < drought_threshold).sum(dim="time")

    # 计算每 10 年内干旱持续时间（SPI < drought_threshold），这里对 SPI 进行二值化后按年份分组求和
    drought_length_decade[period] = (spi_12_future[period] < drought_threshold).astype(int).groupby(spi_12_future[period].time.dt.year // 10).sum(dim="time")

print("✅ 未来 10 年期 SPI-12 统计计算完成！")
