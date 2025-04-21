import regionApi from "./regionApi";
import regions from "../data/regions";

// 定义CMIP5和CMIP6的模型
const CMIP5_MODELS = [
  'CCCma-CanESM2', 'NCC-NorESM1-M', 'CSIRO-BOM-ACCESS1-0', 
  'MIROC-MIROC5', 'NOAA-GFDL-GFDL-ESM2M'
];

const CMIP6_MODELS = [
  'ACCESS-CM2', 'ACCESS-ESM1-5', 'CESM2', 'CNRM-ESM2-1', 'CMCC-ESM2'
];

// 获取模型的函数
const getModels = (source) => {
  return source === 'CMIP5' ? CMIP5_MODELS : CMIP6_MODELS;
};

const getRegionName = (regionId) => {
  const numericId = parseInt(regionId);
  const region = regions.find(r => r.region_id === numericId);
  return region ? region.region_name : "Unknown Region";
};

// 获取原始数据：返回所有模型的baseline和future数据
export const fetchRegionStats = async (filters, regionId) => {
  const [futureStart, futureEnd] = filters["Time Frames"]
    ? filters["Time Frames"].split("-").map((y) => parseInt(y.trim()))
    : [2020, 2050];

  const baseParams = {
    index: filters["Drought Index"]?.toLowerCase(),
    data_source: filters["Source"]?.toLowerCase(),
    threshold: parseFloat(filters["Threshold"]) || -1,
  };

  const models = getModels(filters["Source"]);

  // 用模型的名称作为数据的 key
  const baselineDataByScenario = {};
  const futureDataByScenario = {};

  // 遍历 scenario
  const scenarios = filters["Source"] === "CMIP5" ? ["rcp45", "rcp85"] : ["ssp126", "ssp370"];

  for (const scenario of scenarios) {
    // 对每个 scenario 创建 payload
    const baselineDataByModel = {};
    const futureDataByModel = {};

    // 为每个模型获取原始数据
    for (const model of models) {
      const baselinePayload = {
        ...baseParams,
        region_id: regionId,
        model,  // 添加模型
        scenario, // 添加 scenario
        start_year: 1976,
        end_year: 2005,
      };

      const futurePayload = {
        ...baseParams,
        region_id: regionId,
        model,  // 添加模型
        scenario, // 添加 scenario
        start_year: futureStart,
        end_year: futureEnd,
      };

      // 根据 Definition 来决定调用哪个 API
      const fetchDroughtData = filters["Definition"] === "Change in Number"
        ? regionApi.fetchDroughtEvents
        : regionApi.fetchDroughtMonths;

      const [baselineData, futureData] = await Promise.all([
        fetchDroughtData(baselinePayload),
        fetchDroughtData(futurePayload),
      ]);

      // 使用模型名称作为键来存储数据
      baselineDataByModel[model] = baselineData;
      futureDataByModel[model] = futureData;
    }
    // 使用 scenario 作为键来存储该 scenario 下的所有模型数据
    baselineDataByScenario[scenario] = baselineDataByModel;
    futureDataByScenario[scenario] = futureDataByModel;
  }
  // 获取区域名称
  const regionName = getRegionName(regionId);

  // 返回该区域的 baseline 和 future 数据，使用模型名称作为键
  return {
    region_id: regionId,
    region_name: regionName,
    baselineData: baselineDataByScenario,
    futureData: futureDataByScenario,
  };
};
