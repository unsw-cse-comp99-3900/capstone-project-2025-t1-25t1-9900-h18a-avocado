import os
import glob
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
        pr_region = pr.where(mask_xr, drop=True)
        region_data_dict[region_id] = pr_region
        print(f"Region {region_id} data extracted.")
    print("Split data by NRM regions successfully.")
    return region_data_dict



if __name__ == "__main__":
    # 当前这个 NRM.py 文件的目录
    curr_dir = os.path.dirname(os.path.abspath(__file__))

    # 返回 backend 根目录
    backend_dir = os.path.dirname(curr_dir)

    # 拼接 shapefile 的路径
    shapefile_path = os.path.join(backend_dir, "NRM_regions_2020", "NRM_regions_2020.shp")

    # 读取 shapefile 数据（转换为 EPSG:4326）
    gdf = gpd.read_file(shapefile_path).to_crs(epsg=4326)
    print("Shapefile columns:", gdf.columns)
    print(gdf.head())

    # ds = read_single_nc(os.path.join(backend_dir, "data", "CMIP5", "historical", "pr", "pr_AUS-44i_CCCma-CanESM2_historical_r1i1p1_CSIRO-CCAM-2008_v1_day_19600101-19601231.nc"))
    ds = load_data("CMIP5","rcp45", "pr")


    # 选择降水变量，并转换单位：kg/m²/s → mm/day
    pr = ds["pr"] * 86400
    pr.attrs["units"] = "mm/day"

    # 指定需要分析的区域ID（例如使用 shapefile 中的 NRM_ID 字段）

    regions_dict = extract_regions_from_shapefile(shapefile_path, pr)
    region_id = 1030
    pr_region = regions_dict[region_id]
    print(pr_region)


