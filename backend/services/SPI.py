import xarray as xr
import pandas as pd
from xclim.indices import standardized_precipitation_index
from backend.utils.readNcFiles import load_data
from backend.utils.NRM import get_shapefile_path, extract_regions_from_shapefile


def extract_precipitation_mm_per_day(ds: xr.Dataset) -> xr.DataArray:
    """
    Extract the 'pr' (precipitation) variable from the dataset and convert its unit to mm/day.

    Parameters:
        ds: xarray.Dataset, which must contain a variable named 'pr' in kg/m²/s

    Returns:
        xarray.DataArray with units converted to mm/day
    """
    if "pr" not in ds:
        raise KeyError("The input dataset does not contain the 'pr' variable")

    pr = ds["pr"] * 86400
    pr.attrs["units"] = "mm/day"
    return pr


def compute_spi_for_region(
    model_family: str,
    scenario: str,
    pr_region: xr.DataArray,
    region_id: int,
    region_name: str,
    cal_start: str = "1976-01-01",
    cal_end: str = "2005-12-31"
) -> pd.DataFrame:
    """
    Compute SPI time series for a specific region using its precipitation data.

    Parameters:
        pr_region: xarray.DataArray, precipitation data of the region in mm/day
        region_id: int, region's NRM_ID
        region_name: str, name of the region
        cal_start: str, start of calibration period
        cal_end: str, end of calibration period

    Returns:
        pd.DataFrame containing columns: time, SPI, region_id, region_name
    """
    try:
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

        spi_mean_ts = spi.mean(dim=["lat", "lon"], skipna=True)

        df = spi_mean_ts.to_dataframe(name="SPI").reset_index()
        df["time"] = pd.to_datetime(df["time"].astype(str), errors="coerce")
        df["time"] = df["time"].dt.strftime("%Y-%m")
        df["region_id"] = region_id
        df["region_name"] = region_name
        df["model_family"] = model_family
        df["scenario"] = scenario

        return df

    except Exception as e:
        print(f"[❌] Failed to compute SPI for region {region_id} - {region_name}, error: {e}")
        return pd.DataFrame(columns=["time", "SPI", "region_id", "region_name"])


def export_all_regions_spi_to_csv(region_dict, model_family, scenario, variable, cal_start, cal_end):
    """
    Compute SPI for all regions and export the results to a single CSV file.

    Parameters:
        region_dict: dict, containing region_id → {name, data}
        model_family: str, e.g., CMIP5 or CMIP6
        scenario: str, e.g., rcp45 or rcp85
        variable: str, e.g., pr
        cal_start: str, calibration period start
        cal_end: str, calibration period end
    """
    all_spi_dfs = []
    print("🌏 Starting SPI computation for all regions...")

    for region_id, info in region_dict.items():
        region_name = info["name"]
        pr_region = info["data"]
        print(f"📍 Processing region: {region_id} - {region_name}")
        df_spi = compute_spi_for_region(model_family, scenario,pr_region, region_id, region_name, cal_start, cal_end)
        all_spi_dfs.append(df_spi)

    all_spi_df = pd.concat(all_spi_dfs, ignore_index=True)
    output_path = f"all_regions_spi_{model_family}_{scenario}_{variable}.csv"
    all_spi_df.to_csv(output_path, index=False)

    print(f"[✅] All region SPI results saved to: {output_path}")
    print(f"[📊] Successfully computed SPI for {all_spi_df['region_id'].nunique()} out of {len(region_dict)} regions.")

def compute_spi(model_family, scenario, variable, cal_start, cal_end):
    ds = load_data(model_family, scenario, variable)
    pr = extract_precipitation_mm_per_day(ds)

    shapefile_path = get_shapefile_path()
    region_dict = extract_regions_from_shapefile(shapefile_path, pr)

    export_all_regions_spi_to_csv(region_dict, model_family, scenario, variable, cal_start, cal_end)

if __name__ == "__main__":

    compute_spi("CMIP5", "rcp45", "pr", "1976-01-01", "2005-12-31")
    compute_spi("CMIP5", "rcp85", "pr", "1976-01-01", "2005-12-31")
    compute_spi("CMIP6", "ssp126", "pr", "1976-01-01", "2005-12-31")
    compute_spi("CMIP6", "ssp370", "pr", "1976-01-01", "2005-12-31")
