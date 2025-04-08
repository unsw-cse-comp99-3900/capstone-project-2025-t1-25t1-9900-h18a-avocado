import os
import xarray as xr
import warnings
import cftime
import numpy as np
import pandas as pd


def convert_time_to_noleap(ds):
    """
    Convert dataset time coordinates to cftime.DatetimeNoLeap.
    Handles both cftime and numpy.datetime64 types.
    """
    original_times = ds.time.values
    noleap_times = []
    for t in original_times:
        if isinstance(t, cftime.DatetimeNoLeap):
            noleap_times.append(t)
        elif isinstance(t, (np.datetime64, pd.Timestamp)):
            t = pd.to_datetime(t)
            noleap_times.append(cftime.DatetimeNoLeap(t.year, t.month, t.day, t.hour, t.minute, t.second))
        else:
            raise TypeError(f"Unsupported time type: {type(t)}")
    ds['time'] = ('time', noleap_times)
    return ds


def read_single_nc(filepath):
    """
    Read a single .nc file from the specified path and return an xarray.Dataset.
    Automatically decodes time and handles time conversion.
    """
    if not filepath.endswith(".nc"):
        raise ValueError("The file must be in .nc format")

    ds = xr.open_dataset(filepath, decode_times=True)
    ds = convert_time_to_noleap(ds)
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
                ds = xr.open_dataset(file_path, decode_times=True)
                ds = convert_time_to_noleap(ds)
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

    for filename in sorted(os.listdir(dir_path)):
        if filename.endswith(".nc"):
            file_path = os.path.join(dir_path, filename)
            try:
                ds = xr.open_dataset(file_path, decode_times=True)
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


def get_nc_path(cmip_version="CMIP5", scenario_name="historical", variable_name="pr"):
    """
    Construct the full paths to the  .nc data directories
    for the specified CMIP version, scenario name, and variable name.

    Parameters:
        cmip_version (str): The CMIP version folder (e.g., 'CMIP5','CMIP6')
        scenario_name (str): The model name  (e.g., 'historical', 'rcp45', 'rcp85','ssp126', 'ssp370')
        variable_name (str): The variable name folder (e.g., 'pr', 'tas')

    Returns:
        Str: Full paths to the data directories
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(current_dir)
    data_dir = os.path.join(backend_dir, "data")

    files_path = os.path.join(data_dir, cmip_version, scenario_name, variable_name)

    return files_path


def load_merged_nc_data(cmip_version="CMIP5", scenario_name="historical", variable_name="pr"):
    """
    Load and merge all .nc files under the specified CMIP version, scenario, and variable.
    Time is coerced to cftime.DatetimeNoLeap for consistency.

    Parameters:
        cmip_version (str): The CMIP version folder (e.g., 'CMIP5', 'CMIP6')
        scenario_name (str): The scenario name (e.g., 'historical', 'rcp45', 'ssp126')
        variable_name (str): The variable name (e.g., 'pr', 'tas')

    Returns:
        xarray.Dataset: Merged dataset along the time dimension
    """
    dir_path = get_nc_path(cmip_version, scenario_name, variable_name)
    if not os.path.exists(dir_path):
        raise FileNotFoundError(f"Directory does not exist: {dir_path}")

    datasets = []

    for filename in sorted(os.listdir(dir_path)):
        if filename.endswith(".nc"):
            file_path = os.path.join(dir_path, filename)
            try:
                ds = xr.open_dataset(file_path, decode_times=True)
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


def load_data(cmip_version="CMIP5", scenario_name="rcp45", variable_name="pr"):

    ds_historical = load_merged_nc_data(cmip_version, 'historical', variable_name)
    ds_scenario = load_merged_nc_data(cmip_version, scenario_name, variable_name)

    print("Starting to merge past and future data...")
    combined = xr.concat([ds_historical, ds_scenario], dim="time")

    combined = combined.sortby("time")
    print("Merge data successfully.")
    return combined


if __name__ == '__main__':
    ds = load_data(cmip_version="CMIP6", scenario_name="ssp126", variable_name="pr")
    print(ds.lat.values)
    print(ds.lon.values)
    print(ds.time.values)
