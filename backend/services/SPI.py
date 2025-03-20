import xarray as xr
import xclim.indices as xc
import glob

# choose dataset: "CMIP5" or "CMIP6"
dataset_name = "CMIP6"

# choose emission scenario: "ssp126" or "ssp370"
scenario = "ssp126"

# load historical data (1951-2014)
historical_files = sorted(glob.glob("CMIP6/historical/*.nc"))
ds_historical = xr.open_mfdataset(historical_files, combine="by_coords")

# load future data (2015-2099)
scenario_files = sorted(glob.glob(f"{dataset_name}/{scenario}/*.nc"))
ds_scenario = xr.open_mfdataset(scenario_files, combine="by_coords")

# concatenate historical and future pr
ds = xr.concat([ds_historical, ds_scenario], dim="time")

# select pr variable
pr = ds["pr"]


# 转换单位
pr = pr * 86400  # kg/m²/s → mm/day
pr.attrs["units"] = "mm/day"

# 调正时间块大小
pr = pr.compute()  # 完全加载到 RAM

print("==========================所有pr=================================")
print(pr)
print("================================================================")

# 按照 `time` 变量格式设置 Baseline
cal_start = "1980-01-15"
cal_end = "2019-12-15"

# **计算 SPI**
print("==========================开始计算SPI==============================")
spi_12 = xc.standardized_precipitation_index(
    pr, freq="MS", window=12, dist="gamma", method="ML",
    cal_start=cal_start, cal_end=cal_end
)
print("==========================计算完成=================================")

spi_12.to_netcdf(f"SPI_12_{scenario}.nc")
