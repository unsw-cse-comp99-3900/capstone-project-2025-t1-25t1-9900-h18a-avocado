import xarray as xr
from utils.readNcFiles import load_data  # 你需要啥就导啥
from utils.NRM import get_shapefile_path, extract_single_region_from_shapefile, extract_regions_from_shapefile
import xclim as xc
from xclim.indices import standardized_precipitation_index
import pandas as pd
def extract_precipitation_mm_per_day(ds: xr.Dataset) -> xr.DataArray:
    """
    从 Dataset 中提取降水变量 'pr'，并转换单位为 mm/day。

    参数：
        ds: xarray.Dataset，包含 pr 变量（单位通常是 kg/m²/s）

    返回：
        xarray.DataArray，单位为 mm/day 的降水数据
    """
    if "pr" not in ds:
        raise KeyError("输入数据中不包含 'pr' 变量")

    pr = ds["pr"] * 86400
    pr.attrs["units"] = "mm/day"
    return pr


if __name__ == "__main__":

    ds = load_data("CMIP5","rcp45","pr")
    pr = extract_precipitation_mm_per_day(ds)

    shapefile_path = get_shapefile_path()

    region_id = 1030
    pr_region = extract_single_region_from_shapefile(shapefile_path, region_id, pr)
    # set baseline period
    cal_start = "1980-01-01"
    cal_end = "2019-12-31"

    # **calculate SPI**
    print("==========================Starting the calculation of SPI===============================")
    spi_1 = standardized_precipitation_index(
        pr_region,
        freq="MS",
        window=1,
        dist="gamma",
        method="APP",
        cal_start="1980-01-01",
        cal_end="2019-12-31",
        fitkwargs={"floc": 0},
    )

    print("==========================Calculation finished=================================")
    print(spi_1)

    # Step 1: 区域平均
    spi_mean_ts = spi_1.mean(dim=["lat", "lon"], skipna=True)

    # Step 2: 转为 DataFrame
    df = spi_mean_ts.to_dataframe(name="SPI").reset_index()

    # 转换 cftime 到 datetime，再格式化
    df["time"] = pd.to_datetime(df["time"].astype(str), errors="coerce")
    df["time"] = df["time"].dt.strftime("%Y-%m")

    print(df.head(12))  # 打印前一年（12个月）的平均 SPI

    # Step 3: 保存为 CSV
    output_path = f"region_{region_id}_spi_timeseries.csv"
    df.to_csv(output_path, index=False)

    print(f"[✅] 区域 {region_id} 的 SPI 平均时间序列已保存至 {output_path}")



