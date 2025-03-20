import geopandas as gpd

# 读取 Shapefile
shp_path = "NRM_regions_2020/NRM_regions_2020.shp"
gdf = gpd.read_file(shp_path)

# 提取 `shp` 文件中的区域名称
shp_regions = set(gdf["NRM_REGION"].unique())

print(f"📊 `shp` 文件中包含 {len(shp_regions)} 个 NRM 区域")


