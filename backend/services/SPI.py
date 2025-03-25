import xarray as xr
import glob, os
from utils.readNcFiles import load_data  # 你需要啥就导啥


ds = load_data("CMIP5","rcp45","pr")


# 提取变量 + 单位转换
pr = ds["pr"] * 86400
pr.attrs["units"] = "mm/day"

print(pr)

# # set baseline period
# cal_start = "1980-01-16"
# cal_end = "2019-12-16"
#
# # **calculate SPI**
# print("==========================Starting the calculation of SPI===============================")
# spi_1 = xc.standardized_precipitation_index(
#     pr, freq="MS", window=1, dist="gamma", method="APP",
#     cal_start=cal_start, cal_end=cal_end
# )
# print("==========================Calculation finished=================================")
#
# spi_12.to_netcdf(f"SPI_12_{scenario}.nc")
