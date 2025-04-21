import os
import xarray as xr
from xarray.coding.times import CFDatetimeCoder
import warnings

import cftime

def convert_time_to_noleap(ds):
    """
    Convert dataset time coordinates to cftime.DatetimeNoLeap.
    """
    original_times = ds.time.values
    noleap_times = []
    valid_indices = []
    for i, t in enumerate(original_times):
        try:
            noleap_time = cftime.DatetimeNoLeap(t.year, t.month, t.day, t.hour, t.minute, t.second)
            noleap_times.append(noleap_time)
            valid_indices.append(i)
        except ValueError:
            print(f"[⚠️] Skip leap day: {t}")

    if not noleap_times:
        raise ValueError("All time values are invalid for DatetimeNoLeap.")

    ds = ds.isel(time=valid_indices)
    ds['time'] = ('time', noleap_times)
    return ds

def read_single_nc(filepath):
    """
    Read a single .nc file from the specified path and return an xarray.Dataset.
    Use cftime to decode time to ensure consistent time format.
    """
    if not filepath.endswith(".nc"):
        raise ValueError("The file must be in .nc format")

    decoder = CFDatetimeCoder(use_cftime=True)
    ds = xr.open_dataset(filepath, decode_times=decoder)
    print(f"Reading file: {filepath}")
    print(f"time type: {type(ds.time.values[0])}")
    return ds


def check_nc_time_types_in_dir(dir_path):
    """
    Check the time type (e.g., cftime.DatetimeNoLeap or np.datetime64) of all .nc files in the specified directory.
    """
    found_nc = False
    for filename in os.listdir(dir_path):
        if filename.endswith(".nc"):
            found_nc = True
            file_path = os.path.join(dir_path, filename)
            try:
                decoder = CFDatetimeCoder(use_cftime=True)
                ds = xr.open_dataset(file_path, decode_times=decoder)
                time_type = type(ds.time.values[0])  # Check the type of the first time value
                print(f"{filename}: time type is {time_type}")
            except Exception as e:
                print(f"{filename}: error reading file -> {e}")

    if not found_nc:
        print(f"No .nc files found in directory: {dir_path}")


def read_and_merge_nc_files(dir_path):
    """
    Read all .nc files from the specified directory,
    force time to be in cftime.DatetimeNoLeap format,
    and merge them along the time dimension into a single xarray.Dataset.
    """
    datasets = []
    decoder = CFDatetimeCoder(use_cftime=True)

    for filename in sorted(os.listdir(dir_path)):
        if filename.endswith(".nc"):
            file_path = os.path.join(dir_path, filename)
            try:
                ds = xr.open_dataset(file_path, decode_times=decoder)
                ds = convert_time_to_noleap(ds)
                datasets.append(ds)
                print(f"Read and added to merge list: {filename}, time type: {type(ds.time.values[0])}")
            except Exception as e:
                warnings.warn(f"Failed to read file {filename}: {e}")

    if not datasets:
        raise FileNotFoundError(f"No valid .nc files found in directory: {dir_path}")

    # Merge along the time dimension
    combined = xr.concat(datasets, dim="time")
    return combined


def get_nc_path(cmip_version="CMIP5", scenario_name="historical", variable_name="pr", model_name = None):
    """
    Construct the full paths to the  .nc data directories
    for the specified CMIP version, scenario name, and variable name.

    Parameters:
        cmip_version (str): The CMIP version folder (e.g., 'CMIP5','CMIP6')
        scenario_name (str): The model name  (e.g., 'historical', 'rcp45', 'rcp85','ssp126', 'ssp370')
        variable_name (str): The variable name folder (e.g., 'pr', 'tas')
        model_name (str): The model name (e.g., 'ACCESS-CM2', 'CESM2', 'CNRM-CM6-1', 'CNRM-ESM2-1', 'ACCESS-ESM1-5', 'CCMC-ESM2' for CMIP6. 'CCCma-CanESM2', 'NCC-NorESM2-LM', 'NorESM1-M', 'CSIRO-BOM-ACCESS1-0', 'MIROC-MIROC5', 'NOAA-GFDL-GFDL-ESM2M' for CMIP5.)
    Returns:
        Str: Full paths to the data directories
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(current_dir)
    data_dir = os.path.join(backend_dir, "data")

    files_path = os.path.join(data_dir, cmip_version, scenario_name, variable_name, model_name)

    return files_path

def load_merged_nc_data(cmip_version="CMIP5", scenario_name="historical", variable_name="pr",model_name=None):
    """
    Load and merge all .nc files under the specified CMIP version, scenario, and variable.
    Time is coerced to cftime.DatetimeNoLeap for consistency.

    Parameters:
        cmip_version (str): The CMIP version folder (e.g., 'CMIP5', 'CMIP6')
        scenario_name (str): The scenario name (e.g., 'historical', 'rcp45', 'ssp126')
        variable_name (str): The variable name (e.g., 'pr', 'tas')
        model_name (str): The model name (e.g., 'ACCESS-CM2', 'CESM2', 'CNRM-CM6-1', 'CNRM-ESM2-1', 'ACCESS-ESM1-5', 'CCMC-ESM2' for CMIP6. 'CCCma-CanESM2', 'NCC-NorESM2-LM', 'NorESM1-M', 'CSIRO-BOM-ACCESS1-0', 'MIROC-MIROC5', 'NOAA-GFDL-GFDL-ESM2M' for CMIP5.)

    Returns:
        xarray.Dataset: Merged dataset along the time dimension
    """
    dir_path = get_nc_path(cmip_version, scenario_name, variable_name, model_name)
    if not os.path.exists(dir_path):
        raise FileNotFoundError(f"Directory does not exist: {dir_path}")

    datasets = []
    decoder = CFDatetimeCoder(use_cftime=True)

    for filename in sorted(os.listdir(dir_path)):
        if filename.endswith(".nc"):
            file_path = os.path.join(dir_path, filename)
            try:
                ds = xr.open_dataset(file_path, decode_times=decoder)
                ds = convert_time_to_noleap(ds)
                datasets.append(ds)
                print(f"Read and added to merge list: {filename}, time type: {type(ds.time.values[0])}")
            except Exception as e:
                warnings.warn(f"Failed to read file {filename}: {e}")

    if not datasets:
        raise FileNotFoundError(f"No valid .nc files found in directory: {dir_path}")

    combined = xr.concat(datasets, dim="time")
    print(f"Load {scenario_name} {variable_name} data for {cmip_version} successfully.")
    return combined

def load_data(cmip_version="CMIP5", scenario_name="rcp45", variable_name="pr", model_name=None):

    ds_historical = load_merged_nc_data(cmip_version, 'historical', variable_name, model_name)
    ds_scenario = load_merged_nc_data(cmip_version, scenario_name, variable_name, model_name)

    print("Starting to merge past and future data...")
    combined = xr.concat([ds_historical, ds_scenario], dim="time")

    combined = combined.sortby("time")
    print("Merge data successfully.")
    return combined

if __name__ == '__main__':
    CMIP5_models = ['CCCma-CanESM2', 'NCC-NorESM1-M', 'CSIRO-BOM-ACCESS1-0', 'MIROC-MIROC5', 'NOAA-GFDL-GFDL-ESM2M']
    CMIP6_models = ['ACCESS-CM2', 'ACCESS-ESM1-5', 'CESM2', 'CNRM-ESM2-1', 'CMCC-ESM2']
    ds = load_data(cmip_version="CMIP5", scenario_name="rcp45", variable_name="pr", model_name=CMIP5_models[2])
    # print(ds)
    print(ds.lat.values)
    print(ds.lon.values)
    print(ds.time.values)


    # selected = ds.sel(time=cftime.DatetimeNoLeap(2000, 1, 15, 12), lat=-33.75, lon=151.25, method='nearest')
    #
    # print(selected.pr.values)


