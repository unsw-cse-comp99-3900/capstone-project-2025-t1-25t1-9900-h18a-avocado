import xarray as xr
import pandas as pd
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed

from scipy.stats import fisk, norm

from utils.readNcFiles import load_data
from utils.NRM import get_shapefile_path, extract_regions_from_shapefile


def remove_duplicate_times(ds: xr.Dataset) -> xr.Dataset:
    """
    We use groupby("time").first() to eliminate duplicate time points, keeping only the first data point in each time.
    No sortby("time") is used, reducing the memory footprint significantly.
    """
    # It is recommended to make a certain chunk of ds first, so that groupby aggregation can be processed in chunks, avoiding reading into memory at once
    ds = ds.chunk({"time": 10, "lat": 100, "lon": 100})
    ds_unique = ds.groupby("time").first()
    return ds_unique


def convert_cftime_to_datetime64(ds: xr.Dataset) -> xr.Dataset:
    """
    If the time series is not of the standard np.datetime64 type, a conversion to standard time is attempted.
    """
    if not isinstance(ds.indexes["time"], pd.DatetimeIndex):
        try:
            time_converted = ds.indexes["time"].to_datetimeindex()
            ds["time"] = time_converted
        except Exception as e:
            print("The conversion failed. The reason is:", e)
    return ds


def extract_precipitation_evaporation(ds_pr: xr.Dataset, ds_evap: xr.Dataset) -> xr.DataArray:
    """
    Calculate the water balance wb = pr-evspsbl in mm/day.
    Keep Dask lazy evaluation and don't call.load().
    """
    # If the time is not of type np.datetime64, convert it first
    if not np.issubdtype(ds_pr.time.dtype, np.datetime64):
        ds_pr = ds_pr.convert_calendar("standard", use_cftime=False)
        ds_evap = ds_evap.convert_calendar("standard", use_cftime=False)

    # Uniform timestamp to 00:00:00
    ds_pr["time"] = pd.to_datetime(ds_pr.time.values).normalize()
    ds_evap["time"] = pd.to_datetime(ds_evap.time.values).normalize()

    # Conversion units: from kg/(m^2·s) to mm/day
    pr = ds_pr["pr"] * 86400
    pr.attrs["units"] = "mm/day"

    evspsbl = ds_evap["evspsbl"] * 86400
    evspsbl.attrs["units"] = "mm/day"

    wb = pr - evspsbl
    wb.name = "wb"
    wb.attrs["units"] = "mm/day"

    return wb


def compute_spei_loglogistic(wb_array: np.ndarray) -> np.ndarray:
    """
    A log-log (Fisk) distribution was fitted to the water balance data with positive and negative values separately to obtain the SPEI.
    wb_array: 1D numpy array (can contain positive and negative values)
    Returns the SPEI normalized value of the same length.
    """
    wb = wb_array.flatten()
    pos_mask = wb >= 0
    neg_mask = wb < 0

    if np.sum(pos_mask) < 5 or np.sum(neg_mask) < 5:
        raise ValueError("The sample size for positive or negative intervals was too small to fit the log-log distributions separately.")

    pos_params = fisk.fit(wb[pos_mask], floc=0)
    F_pos = fisk.cdf(wb[pos_mask], *pos_params)
    spei_pos = norm.ppf(F_pos)

    neg_params = fisk.fit(-wb[neg_mask], floc=0)
    F_neg = 1.0 - fisk.cdf(-wb[neg_mask], *neg_params)
    spei_neg = norm.ppf(F_neg)

    spei = np.empty_like(wb)
    spei[pos_mask] = spei_pos
    spei[neg_mask] = spei_neg

    return spei


def compute_spei_for_region(
    wb_region: xr.DataArray,
    model_family: str,
    scenario: str,
    model_name: str,
    region_id: int,
    region_name: str,
    cal_start: str = "1976-01-01",
    cal_end: str = "2005-12-31",
) -> pd.DataFrame:
    """
    The SPEI is calculated for the wb data in a specific region and returns pd.DataFrame.
    """
    try:
        wb_region = wb_region.sortby("time")
        wb_region = wb_region.resample(time="MS").sum()

        # check the number of time points
        if wb_region.time.size < 3:
            print(f"region {region_id} - {region_name}: the time point is less than 3, the calculation is skipped.")
            return pd.DataFrame(
                columns=["time","SPEI","region_id","region_name","model_family","scenario","model_name"]
            )

        wb_1d = wb_region.mean(dim=["lat","lon"], skipna=True)

        # compute SPEI
        spei_values = compute_spei_loglogistic(wb_1d.values)
        spei_da = xr.DataArray(spei_values, coords=[wb_1d.time], dims=["time"])
        df = spei_da.to_dataframe(name="SPEI").reset_index()

        # Formatting time
        df["time"] = pd.to_datetime(df["time"], errors="coerce").dt.strftime("%Y-%m")

        # Meta information
        df["region_id"] = region_id
        df["region_name"] = region_name
        df["model_family"] = model_family
        df["scenario"] = scenario
        df["model_name"] = model_name

        return df
    except Exception as e:
        print(f" Failed to compute SPEI for region {region_id} - {region_name}, {type(e).__name__}: {e}")
        return pd.DataFrame(
            columns=["time","SPEI","region_id","region_name","model_family","scenario","model_name"]
        )


def export_all_regions_spei_to_csv(
    region_dict: dict,
    model_family: str,
    scenario: str,
    model_name: str,
    variable: str,
    cal_start: str,
    cal_end: str,
):
    """
    SPEI is computed for all regions in parallel and the summary CSV is derived.
    """
    all_spei_dfs = []
    print(f" Starting SPEI computation for all regions (parallel)... [model={model_name}]")

    for region_id, da in region_dict.items():
        da.attrs.setdefault("units", "mm/day")

    region_dict = {
        region_id: da for region_id, da in region_dict.items()
        if da.sizes.get("lat", 0) > 0 and da.sizes.get("lon", 0) > 0
    }
    print(f" Filtered and retained {len(region_dict)} non-empty regions.")

    def compute_single(region_id, data_array):
        region_name = f"Region_{region_id}"
        print(f" [START] {region_id} - {region_name}")
        return compute_spei_for_region(
            wb_region=data_array,
            model_family=model_family,
            scenario=scenario,
            model_name=model_name,
            region_id=region_id,
            region_name=region_name,
            cal_start=cal_start,
            cal_end=cal_end,
        )

    with ThreadPoolExecutor(max_workers=1) as executor:
        futures = {
            executor.submit(compute_single, region_id, data_array): region_id
            for region_id, data_array in region_dict.items()
        }
        for future in as_completed(futures):
            try:
                result = future.result()
                all_spei_dfs.append(result)
            except Exception as e:
                rid = futures[future]
                print(f" Exception in region {rid}: {e}")

    if all_spei_dfs:
        all_spei_df = pd.concat(all_spei_dfs, ignore_index=True)
    else:
        all_spei_df = pd.DataFrame(
            columns=["time","SPEI","region_id","region_name","model_family","scenario","model_name"]
        )

    output_path = f"all_regions_spei_{model_family}_{scenario}_{variable}_{model_name}.csv"
    all_spei_df.to_csv(output_path, index=False)
    print(f" All region SPEI results saved to: {output_path}")
    print(f" Computed SPEI for {all_spei_df['region_id'].nunique()} out of {len(region_dict)} regions.")


def compute_spei(
    model_family: str,
    scenario: str,
    model_name: str,
    variable: str,
    cal_start: str = "1976-01-01",
    cal_end: str = "2005-12-31",
):
    """
    """
    print(f" Loading {model_family} data for model={model_name}, scenario={scenario}...")

    # 读入 historical + scenario
    ds_var_hist = load_data(model_family, "historical", variable, model_name)
    ds_var_fut = load_data(model_family, scenario, variable, model_name)

    ds_evap_hist = load_data(model_family, "historical", "evspsbl", model_name)
    ds_evap_fut = load_data(model_family, scenario, "evspsbl", model_name)

    print("Starting to merge past and future data...")
    ds_var = xr.concat([ds_var_hist, ds_var_fut], dim="time")
    ds_evap = xr.concat([ds_evap_hist, ds_evap_fut], dim="time")
    print("Merge data successfully.")
    ds_var = remove_duplicate_times(ds_var)
    ds_evap = remove_duplicate_times(ds_evap)

    # ========================================================

    ds_var = convert_cftime_to_datetime64(ds_var)
    ds_evap = convert_cftime_to_datetime64(ds_evap)

    print(" Computing water balance (pr - evspsbl)...")
    wb = extract_precipitation_evaporation(ds_var, ds_evap)

    print("🗺️  Splitting by NRM regions...")
    shapefile_path = get_shapefile_path()
    region_dict = extract_regions_from_shapefile(shapefile_path, wb)

    export_all_regions_spei_to_csv(
        region_dict,
        model_family=model_family,
        scenario=scenario,
        model_name=model_name,
        variable=variable,
        cal_start=cal_start,
        cal_end=cal_end,
    )


if __name__ == "__main__":
    # CMIP5_models = ['CCCma-CanESM2', 'NCC-NorESM1-M', 'CSIRO-BOM-ACCESS1-0', 'MIROC-MIROC5', 'NOAA-GFDL-GFDL-ESM2M']
    # CMIP6_models = ['ACCESS-CM2', 'ACCESS-ESM1-5', 'CESM2', 'CNRM-ESM2-1', 'CMCC-ESM2']

    # for model_name in CMIP6_models:
    #     compute_spei("CMIP6", "ssp126", model_name=model_name, variable="pr",
    #                 cal_start="1976-01-01", cal_end="2005-12-31")
    #     compute_spei("CMIP6", "ssp370", model_name=model_name, variable="pr",
    #                 cal_start="1976-01-01", cal_end="2005-12-31")

    # for model_name in CMIP5_models:
    #     compute_spei("CMIP5", "rcp45", model_name=model_name, variable="pr",
    #                 cal_start="1976-01-01", cal_end="2005-12-31")
    #     compute_spei("CMIP5", "rcp85", model_name=model_name, variable="pr",
    #                 cal_start="1976-01-01", cal_end="2005-12-31")

    model = "CCCma-CanESM2"
    start, end = "1976-01-01", "2005-12-31"


    compute_spei(
        model_family="CMIP5",
        scenario="rcp45",
        model_name=model,
        variable="pr",
        cal_start=start,
        cal_end=end,
    )


    # compute_spei(
    #     model_family="CMIP5",
    #     scenario="rcp85",
    #     model_name=model,
    #     variable="pr",
    #     cal_start=start,
    #     cal_end=end,
    # )

