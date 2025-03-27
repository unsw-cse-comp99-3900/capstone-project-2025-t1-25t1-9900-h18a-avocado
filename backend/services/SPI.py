import xarray as xr
from backend.utils.readNcFiles import load_data  # 你需要啥就导啥
from backend.utils.NRM import get_shapefile_path, extract_single_region_from_shapefile, extract_regions_from_shapefile
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

def compute_spi_for_region(
    pr_region: xr.DataArray,
    region_id: int,
    region_name: str,
    cal_start: str = "1976-01-01",
    cal_end: str = "2005-12-31"
) -> pd.DataFrame:
    """
    给定某区域的降水数据，计算该区域的 SPI 并返回每月平均 SPI 的 DataFrame。

    参数：
        pr_region: xr.DataArray，该区域的降水数据（单位 mm/day）
        region_id: int，区域 ID
        region_name: str，区域名称
        cal_start: str，SPI 的基准期起始时间（默认1976-01-01）
        cal_end: str，SPI 的基准期结束时间（默认2005-12-31）

    返回：
        pd.DataFrame，包含 time（年月）、SPI、region_id、region_name 的数据
    """
    try:
        # 计算 SPI
        spi = standardized_precipitation_index(
            pr_region,
            freq="MS",
            window=1,
            dist="gamma",
            method="APP",
            cal_start=cal_start,
            cal_end=cal_end,
            fitkwargs={"floc": 0},
        )

        # 区域平均
        spi_mean_ts = spi.mean(dim=["lat", "lon"], skipna=True)

        # 转为 DataFrame
        df = spi_mean_ts.to_dataframe(name="SPI").reset_index()
        df["time"] = pd.to_datetime(df["time"].astype(str), errors="coerce")
        df["time"] = df["time"].dt.strftime("%Y-%m")
        df["region_id"] = region_id
        df["region_name"] = region_name

        return df

    except Exception as e:
        print(f"[❌] SPI calculation failed for region: {region_id} - {region_name}, 错误: {e}")
        return pd.DataFrame(columns=["time", "SPI", "region_id", "region_name"])

def export_all_regions_spi_to_csv(region_dict, model_family, scenario, variable, cal_start, cal_end):
    all_spi_dfs = []
    print("🌏 Starting to calculate all regions' SPI...")

    for region_id, info in region_dict.items():
        region_name = info["name"]
        pr_region = info["data"]
        print(f"📍 processing：{region_id} - {region_name}")
        df_spi = compute_spi_for_region(pr_region, region_id, region_name, cal_start, cal_end)
        all_spi_dfs.append(df_spi)

    all_spi_df = pd.concat(all_spi_dfs, ignore_index=True)
    output_path = f"all_regions_spi_{model_family}_{scenario}_{variable}.csv"
    all_spi_df.to_csv(output_path, index=False)
    print(f"[✅] all regions' SPI already saved to {output_path}")


if __name__ == "__main__":

    model_family = "CMIP5"
    scenario = "rcp45"
    variable = "pr"
    cal_start = "1976-01-01"
    cal_end = "2005-12-31"

    ds = load_data(model_family, scenario, variable)
    pr = extract_precipitation_mm_per_day(ds)

    shapefile_path = get_shapefile_path()
    region_dict = extract_regions_from_shapefile(shapefile_path, pr)

    export_all_regions_spi_to_csv(region_dict, model_family, scenario, variable, cal_start, cal_end)





