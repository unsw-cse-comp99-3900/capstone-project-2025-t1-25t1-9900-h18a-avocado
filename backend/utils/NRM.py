import os
import xarray as xr
import geopandas as gpd
import numpy as np
from shapely.vectorized import contains
from backend.utils.readNcFiles import load_data, read_single_nc

def extract_regions_from_shapefile(shapefile_path: str, pr: xr.DataArray):

    gdf = gpd.read_file(shapefile_path).to_crs(epsg=4326)

    lon_grid, lat_grid = np.meshgrid(pr.lon.values, pr.lat.values)

    region_data_dict = {}
    print("Starting split data by NRM regions...")
    for _, row in gdf.iterrows():
        region_id = row["NRM_ID"]
        region_name = row["NRM_REGION"]
        poly = row.geometry

        mask = contains(poly, lon_grid, lat_grid)
        mask_xr = xr.DataArray(mask, dims=("lat", "lon"), coords={"lat": pr.lat.values, "lon": pr.lon.values})

        pr_region = pr.where(mask_xr, drop=True)
        region_data_dict[region_id] = {
            "name": region_name,
            "data": pr_region
        }
        print(f"Region {region_id} ({region_name}) data extracted.")
    print("Split data by NRM regions successfully.")
    return region_data_dict
def extract_single_region_from_shapefile(shapefile_path: str, region_id: int, pr: xr.DataArray) -> xr.DataArray:
    """
    according to the NRM_ID in the shapefile, extract the subset of precipitation data within that region.
    
    Parameters:
      shapefile_path: str, path to the shapefile
      region_id: int, NRM region ID
      pr: xarray.DataArray, precipitation data (needs lat and lon coordinates)

    Returns:
      pr_region: xarray.DataArray, precipitation data only containing the data within that region
    """
    gdf = gpd.read_file(shapefile_path).to_crs(epsg=4326)

    # select the region with the specified NRM_ID
    region_row = gdf[gdf["NRM_ID"] == region_id]
    if region_row.empty:
        raise ValueError(f"the region with NRM_ID {region_id} not found in the shapefile")

    poly = region_row.geometry.iloc[0]

    # create a meshgrid of lon and lat
    lon_grid, lat_grid = np.meshgrid(pr.lon.values, pr.lat.values)

    # select the data within the polygon
    mask = contains(poly, lon_grid, lat_grid)
    mask_xr = xr.DataArray(mask, dims=("lat", "lon"), coords={"lat": pr.lat.values, "lon": pr.lon.values})

    print(f"starting to extract data for region {region_id}...")
    # apply the mask to the precipitation data
    pr_region = pr.where(mask_xr, drop=True)

    print(f"extracting data for region {region_id} completed.")
    return pr_region

def get_shapefile_path(filename: str = "NRM_regions_2020.shp") -> str:
    """
    build the absolute path of the shapefile, assuming the shapefile is stored in the backend/NRM_regions_2020 folder.
    
    Parameters:
      filename: str, optional, default is "NRM_regions_2020.shp"
    
    Returns:
      shapefile_path: str, the full path
    """
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(curr_dir)
    shapefile_path = os.path.join(backend_dir, "NRM_regions_2020", filename)
    return shapefile_path



if __name__ == "__main__":
    # gain the path of the shapefile
    shapefile_path = get_shapefile_path()

    # ds = read_single_nc(os.path.join(backend_dir, "data", "CMIP5", "historical", "pr", "pr_AUS-44i_CCCma-CanESM2_historical_r1i1p1_CSIRO-CCAM-2008_v1_day_19600101-19601231.nc"))
    ds = load_data("CMIP5","rcp45", "pr")

    # select precipitation variable and convert units (kg/m²/s → mm/day)
    pr = ds["pr"] * 86400
    pr.attrs["units"] = "mm/day"

    # setup the region ID you want to analyze (e.g., using the NRM_ID field in the shapefile)

    # # regions_dict = extract_regions_from_shapefile(shapefile_path, pr)
    # region_id = 1030
    # # pr_region = regions_dict[region_id]
    # # print(pr_region)
    #
    # pr_region = extract_single_region_from_shapefile(shapefile_path, region_id, pr)
    # print(pr_region)
    regions = extract_regions_from_shapefile(shapefile_path, pr)
    region1030 = regions[1030]
    print(region1030["name"])  # Greater Sydney
    print(region1030["data"])  # xarray.DataArray