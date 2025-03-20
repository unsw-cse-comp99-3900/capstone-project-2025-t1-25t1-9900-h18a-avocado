import xarray as xr
import geopandas as gpd
import glob
import numpy as np
from shapely.geometry import Point

def extract_region_pr(region_id,pr):
    """
    提取指定 NRM 区域的 NetCDF 降水数据
    :param region_id: 需要筛选的 NRM 区域 ID
    :return: 该区域的 NetCDF 降水数据 (pr_region)
    """
    # 获取指定 region_id 的 NRM 区域
    region = gdf[gdf["REGION_ID"] == region_id]
    if region.empty:
        raise ValueError(f"❌ NRM 区域 {region_id} 未找到！")

    print(f"⚙️ 提取 NRM 区域 {region_id} 内的降水数据...")

    # 提取 NetCDF 文件中的经纬度点
    lon_values = pr.lon.values
    lat_values = pr.lat.values

    # **创建 mask，筛选出 NetCDF 数据中落在该 NRM 区域内的经纬度点**
    mask = np.full((len(lat_values), len(lon_values)), False)
    for i, lat in enumerate(lat_values):
        for j, lon in enumerate(lon_values):
            point = Point(lon, lat)
            if region.geometry.iloc[0].contains(point):
                mask[i, j] = True  # 标记落在区域内的点

    # 📌 **转换 mask 为 xarray.DataArray**
    mask_xr = xr.DataArray(mask, dims=("lat", "lon"), coords={"lat": lat_values, "lon": lon_values})

    # 📌 **筛选区域内的降水数据**
    pr_region = pr.where(mask_xr, drop=True)

    print(f"✅ NRM 区域 {region_id} 的降水数据提取完成！")
    return pr_region


if __name__ == "__main__":
    # 读取 NRM 区域数据
    shp_path = "ADMIN_NrmRegions_shp/ADMIN_NrmRegions_GDA2020.shp"
    gdf = gpd.read_file(shp_path).to_crs(epsg=4326)  # 确保坐标系一致

    # 📌 读取 NetCDF 降水数据
    pr_files = sorted(glob.glob("CMIP6/historical/*.nc"))
    ds = xr.open_mfdataset(pr_files, combine="by_coords")

    # 📌 选择降水变量，并转换单位（kg/m²/s → mm/day）
    pr = ds["pr"] * 86400
    pr.attrs["units"] = "mm/day"
    # 选择需要提取的 NRM 区域 ID
    region_id = 4

    # 提取指定 NRM 区域的 NetCDF 降水数据
    pr_selected = extract_region_pr(region_id,pr)

    # 输出结果
    print(pr)
    print("================================")
    print(pr_selected)
