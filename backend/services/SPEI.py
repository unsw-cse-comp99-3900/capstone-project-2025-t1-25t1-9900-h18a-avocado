import xarray as xr
import pandas as pd
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
from xclim.indicators.atmos import standardized_precipitation_evapotranspiration_index
from utils.readNcFiles import load_data
from utils.NRM import get_shapefile_path, extract_regions_from_shapefile

def convert_cftime_to_datetime64(ds: xr.Dataset) -> xr.Dataset:
    if not isinstance(ds.indexes["time"], pd.DatetimeIndex):
        try:
            time_converted = ds.indexes["time"].to_datetimeindex()

            ds["time"] = time_converted
        except Exception as e:
            print("[❌] 时间转换失败，原因：", e)
    return ds

def extract_precipitation_evaporation(ds_pr: xr.Dataset, ds_evap: xr.Dataset) -> xr.DataArray:
    # 如果时间不是 np.datetime64 类型，则转换日历为标准时间
    if not np.issubdtype(ds_pr.time.dtype, np.datetime64):
        ds_pr = ds_pr.convert_calendar('standard', use_cftime=False)
        ds_evap = ds_evap.convert_calendar('standard', use_cftime=False)
    
    # 统一为午夜时间戳
    ds_pr["time"] = pd.to_datetime(ds_pr.time.values).normalize()
    ds_evap["time"] = pd.to_datetime(ds_evap.time.values).normalize()
    
    # 单位换算：将 pr 与 evspsbl 分别乘以 86400 转换成 mm/day
    pr = ds_pr["pr"].load() * 86400
    pr.attrs["units"] = "mm/day"

    evspsbl = ds_evap["evspsbl"].load() * 86400
    evspsbl.attrs["units"] = "mm/day"

    wb = pr - evspsbl
    wb.name = "wb"
    wb.attrs["units"] = "mm/day"  # 保持单位属性

    return wb

def compute_spei_for_region(
    wb_region: xr.DataArray,
    model_family: str,
    scenario: str,
    region_id: int,
    region_name: str,
    cal_start: str = "1976-01-01",
    cal_end: str = "2005-12-31"
) -> pd.DataFrame:
    try:
        # 🧯 Step 0：确保有 units 属性
        wb_region.attrs.setdefault("units", "mm/day")

        # 🧱 Step 1：时间排序，确保 monotonic
        wb_region = wb_region.sortby("time")

        # 🗓️ Step 2：聚合为月频
        wb_region = wb_region.resample(time="MS").sum()
        wb_region = wb_region.assign_attrs(units="mm/day")
        # 🔒 Step 3：过滤非法值（必须 > 0）
        wb_region = wb_region.where(wb_region > 0)

        # 🧪 Step 4：校验时间点是否足够
        if wb_region.time.size < 3:
            print(f"[⚠️] 区域 {region_id} - {region_name}：时间点不足 3，跳过计算。")
            return pd.DataFrame(columns=["time", "SPEI", "region_id", "region_name", "model_family", "scenario"])

        # 🧮 Step 5：计算 SPEI
        spei = standardized_precipitation_evapotranspiration_index(
            wb_region,
            freq="MS",
            window=1,
            dist="gamma",
            method="ML",
            cal_start=cal_start,
            cal_end=cal_end,
            fitkwargs={"floc": 0}
        )

        # 🎯 Step 6：区域平均 + 转换为 DataFrame
        spei_mean_ts = spei.mean(dim=["lat", "lon"], skipna=True)

        df = spei_mean_ts.to_dataframe(name="SPEI").reset_index()
        df["time"] = pd.to_datetime(df["time"].astype(str), errors="coerce")
        df["time"] = df["time"].dt.strftime("%Y-%m")
        df["region_id"] = region_id
        df["region_name"] = region_name
        df["model_family"] = model_family
        df["scenario"] = scenario

        return df

    except Exception as e:
        print(f"[❌] Failed to compute SPEI for region {region_id} - {region_name}, error: {type(e).__name__}: {e}")
        return pd.DataFrame(columns=["time", "SPEI", "region_id", "region_name", "model_family", "scenario"])

def export_all_regions_spei_to_csv(region_dict, model_family, scenario, variable, cal_start, cal_end):
    all_spei_dfs = []
    print("🌍 Starting SPEI computation for all regions (parallel)...")

    for region_id, da in region_dict.items():
        da.attrs.setdefault("units", "mm/day")

    region_dict = {
        region_id: da for region_id, da in region_dict.items()
        if da.sizes.get("lat", 0) > 0 and da.sizes.get("lon", 0) > 0
    }
    print(f"🚀 Filtered and retained {len(region_dict)} non-empty regions.")

    def compute_single(region_id, data_array):
        region_name = f"Region_{region_id}"
        print(f"📍 [START] {region_id} - {region_name}")
        return compute_spei_for_region(
            wb_region=data_array,
            model_family=model_family,
            scenario=scenario,
            region_id=region_id,
            region_name=region_name,
            cal_start=cal_start,
            cal_end=cal_end
        )

    with ThreadPoolExecutor(max_workers=6) as executor:
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
                print(f"[❌] Exception in region {rid}: {e}")

    if all_spei_dfs:
        all_spei_df = pd.concat(all_spei_dfs, ignore_index=True)
    else:
        all_spei_df = pd.DataFrame(columns=["time", "SPEI", "region_id", "region_name", "model_family", "scenario"])

    output_path = f"all_regions_spei_{model_family}_{scenario}_{variable}.csv"
    all_spei_df.to_csv(output_path, index=False)

    print(f"[✅] All region SPEI results saved to: {output_path}")
    print(f"[📊] Successfully computed SPEI for {all_spei_df['region_id'].nunique()} out of {len(region_dict)} regions.")

def compute_spei(model_family, scenario, variable, cal_start="1976-01-01", cal_end="2005-12-31"):
    print(f"📦 Loading {model_family} historical + {scenario} for {variable} and evspsbl...")

    ds_var_hist = load_data(model_family, "historical", variable)
    ds_var_fut = load_data(model_family, scenario, variable)
    ds_evap_hist = load_data(model_family, "historical", "evspsbl")
    ds_evap_fut = load_data(model_family, scenario, "evspsbl")

    ds_var = xr.concat([ds_var_hist, ds_var_fut], dim="time")
    ds_evap = xr.concat([ds_evap_hist, ds_evap_fut], dim="time")

    ds_var = convert_cftime_to_datetime64(ds_var)
    ds_evap = convert_cftime_to_datetime64(ds_evap)

    print("🧮 Computing water balance...")
    wb = extract_precipitation_evaporation(ds_var, ds_evap)
    
    # # ✅ 降采样空间分辨率（调试用，加快区域切割）
    # wb = wb.coarsen(lat=2, lon=2, boundary="trim").mean()
    # print("📉 Applied spatial coarsening to speed up region mask")

    print("🗺️  Splitting by NRM regions...")
    shapefile_path = get_shapefile_path()
    region_dict = extract_regions_from_shapefile(shapefile_path, wb)

    export_all_regions_spei_to_csv(region_dict, model_family, scenario, variable, cal_start, cal_end)

if __name__ == "__main__":
    compute_spei("CMIP5", "rcp45", "pr", "1976-01-01", "2005-12-31")
    compute_spei("CMIP5", "rcp85", "pr", "1976-01-01", "2005-12-31")
    compute_spei("CMIP6", "ssp126", "pr", "1976-01-01", "2005-12-31")
    compute_spei("CMIP6", "ssp370", "pr", "1976-01-01", "2005-12-31")