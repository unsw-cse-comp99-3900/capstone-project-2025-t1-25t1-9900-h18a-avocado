import os
import xarray as xr
import geopandas as gpd
import numpy as np
from shapely.vectorized import contains
from utils.readNcFiles import load_data, read_single_nc


def extract_regions_from_shapefile(shapefile_path: str, pr: xr.DataArray):
    """
    从 shapefile 中提取每个 NRM 区域对应的降水子集数据。

    参数：
      shapefile_path: str，shapefile 文件路径
      pr: xarray.DataArray，降水数据（需要有 lat 和 lon 坐标）

    返回：
      region_data_dict: dict，键为 NRM_ID，值为对应区域内的降水数据子集（xarray.DataArray）
    """
    gdf = gpd.read_file(shapefile_path).to_crs(epsg=4326)

    # 创建经纬度网格
    lon_grid, lat_grid = np.meshgrid(pr.lon.values, pr.lat.values)

    region_data_dict = {}
    print("Starting split data by NRM regions...")
    for _, row in gdf.iterrows():
        region_id = row["NRM_ID"]
        poly = row.geometry

        mask = contains(poly, lon_grid, lat_grid)
        mask_xr = xr.DataArray(mask, dims=("lat", "lon"), coords={"lat": pr.lat.values, "lon": pr.lon.values})

        # 筛选该区域的数据
        # 筛选该区域的数据
        pr_region = pr.where(mask_xr, drop=True)

        # 🧯 检查是否为空区域（没有有效数据）
        if pr_region.sizes.get("lat", 0) == 0 or pr_region.sizes.get("lon", 0) == 0:
            print(f"[⚠️] Region {region_id} has no valid data, skipping.")
            continue

        # ✅ 防止单位属性丢失
        if "units" not in pr_region.attrs or pr_region.attrs["units"] is None:
            pr_region.attrs["units"] = "mm/day"

        region_data_dict[region_id] = pr_region
        print(f"Region {region_id} data extracted.")

    print("Split data by NRM regions successfully.")
    return region_data_dict

def extract_single_region_from_shapefile(shapefile_path: str, region_id: int, pr: xr.DataArray) -> xr.DataArray:
    """
    根据 shapefile 中指定的 NRM_ID 区域，提取该区域内的降水子集数据。

    参数：
      shapefile_path: str，shapefile 文件路径
      region_id: int，NRM 区域 ID
      pr: xarray.DataArray，降水数据（需要有 lat 和 lon 坐标）

    返回：
      pr_region: xarray.DataArray，仅包含该区域内的降水数据
    """
    gdf = gpd.read_file(shapefile_path).to_crs(epsg=4326)

    # 选择指定的区域
    region_row = gdf[gdf["NRM_ID"] == region_id]
    if region_row.empty:
        raise ValueError(f"未找到 NRM_ID 为 {region_id} 的区域")

    poly = region_row.geometry.iloc[0]

    # 创建经纬度网格
    lon_grid, lat_grid = np.meshgrid(pr.lon.values, pr.lat.values)

    # 掩码筛选
    mask = contains(poly, lon_grid, lat_grid)
    mask_xr = xr.DataArray(mask, dims=("lat", "lon"), coords={"lat": pr.lat.values, "lon": pr.lon.values})

    print(f"开始提取区域 {region_id} 的数据...")
    # 应用掩码
    pr_region = pr.where(mask_xr, drop=True)

    print(f"提取区域 {region_id} 数据成功.")
    return pr_region

def get_shapefile_path(filename: str = "NRM_regions_2020.shp") -> str:
    """
    构造 shapefile 的绝对路径，假设 shapefile 存放在 backend/NRM_regions_2020 文件夹下。

    参数：
      filename: str，可选，默认是 "NRM_regions_2020.shp"

    返回：
      shapefile_path: str，完整路径
    """
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(curr_dir)
    shapefile_path = os.path.join(backend_dir, "NRM_regions_2020", filename)
    return shapefile_path



if __name__ == "__main__":
    # 获取shapefile路径
    shapefile_path = get_shapefile_path()


    # ds = read_single_nc(os.path.join(backend_dir, "data", "CMIP5", "historical", "pr", "pr_AUS-44i_CCCma-CanESM2_historical_r1i1p1_CSIRO-CCAM-2008_v1_day_19600101-19601231.nc"))
    ds = load_data("CMIP5","rcp45", "pr")


    # 选择降水变量，并转换单位：kg/m²/s → mm/day
    pr = ds["pr"] * 86400
    pr.attrs["units"] = "mm/day"

    # 指定需要分析的区域ID（例如使用 shapefile 中的 NRM_ID 字段）

    # regions_dict = extract_regions_from_shapefile(shapefile_path, pr)
    region_id = 1030
    # pr_region = regions_dict[region_id]
    # print(pr_region)

    pr_region = extract_single_region_from_shapefile(shapefile_path, region_id, pr)
    print(pr_region)
