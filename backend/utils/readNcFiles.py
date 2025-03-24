import os
import xarray as xr
from xarray.coding.times import CFDatetimeCoder
import warnings

def read_single_nc(filepath):
    """
    读取指定路径的 .nc 文件，返回 xarray.Dataset。
    使用 cftime 解码时间，确保时间类型一致。
    """
    if not filepath.endswith(".nc"):
        raise ValueError("文件必须是 .nc 格式")

    decoder = CFDatetimeCoder(use_cftime=True)
    ds = xr.open_dataset(filepath, decode_times=decoder)
    print(f"读取文件: {filepath}")
    print(f"time 类型: {type(ds.time.values[0])}")
    return ds

def check_nc_time_types_in_dir(dir_path):
    """
    检查指定目录下所有 .nc 文件的时间类型（例如 cftime.DatetimeNoLeap 或 np.datetime64）。
    """
    found_nc = False
    for filename in os.listdir(dir_path):
        if filename.endswith(".nc"):
            found_nc = True
            file_path = os.path.join(dir_path, filename)
            try:
                decoder = CFDatetimeCoder(use_cftime=True)
                ds = xr.open_dataset(file_path, decode_times=decoder)
                time_type = type(ds.time.values[0])  # 检查第一个时间值的类型
                print(f"{filename}: time 类型是 {time_type}")
            except Exception as e:
                print(f"{filename}: 读取出错 -> {e}")

    if not found_nc:
        print(f"目录 {dir_path} 中没有找到 .nc 文件")

def read_and_merge_nc_files(dir_path):
    """
    读取指定目录下所有 .nc 文件，强制将时间统一为 cftime.DatetimeNoLeap 格式，
    并按照时间维度合并返回一个 xarray.Dataset。
    """
    datasets = []
    decoder = CFDatetimeCoder(use_cftime=True)

    for filename in sorted(os.listdir(dir_path)):
        if filename.endswith(".nc"):
            file_path = os.path.join(dir_path, filename)
            try:
                ds = xr.open_dataset(file_path, decode_times=decoder)
                datasets.append(ds)
                print(f"读取并加入合并列表: {filename}, time 类型: {type(ds.time.values[0])}")
            except Exception as e:
                warnings.warn(f"无法读取文件 {filename}: {e}")

    if not datasets:
        raise FileNotFoundError(f"目录中未找到有效的 .nc 文件: {dir_path}")

    # 按 time 维度合并
    combined = xr.concat(datasets, dim="time")
    return combined

if __name__ == '__main__':
    utils_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(utils_dir)
    data_dir = os.path.join(backend_dir, "data")
    pr_files_historical = os.path.join(data_dir, "CMIP5", "historical", "pr")
    pr_files_rcp45 = os.path.join(data_dir, "CMIP5", "rcp45", "pr")

    # check_nc_time_types_in_dir(pr_files_historical)
    # check_nc_time_types_in_dir(pr_files_rcp45)

    ds_historical = read_and_merge_nc_files(pr_files_historical)
    print(ds_historical)
