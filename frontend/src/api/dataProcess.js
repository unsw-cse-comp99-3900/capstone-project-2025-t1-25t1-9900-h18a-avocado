import mapApi from "./mapApi";
import regions from "../data/regions";

// CMIP5 和 CMIP6 的模型
const CMIP5_MODELS = [
  'CCCma-CanESM2', 'NCC-NorESM1-M', 'CSIRO-BOM-ACCESS1-0', 
  'MIROC-MIROC5', 'NOAA-GFDL-GFDL-ESM2M'
];

const CMIP6_MODELS = [
  'ACCESS-CM2', 'ACCESS-ESM1-5', 'CESM2', 'CNRM-ESM2-1', 'CMCC-ESM2'
];

// 根据 Source 选择模型
const getModels = (source) => {
  return source === 'CMIP5' ? CMIP5_MODELS : CMIP6_MODELS;
};

export const calculateRegionDiffs = async (filters) => {
  console.log("filters:", filters);
  const [futureStart, futureEnd] = filters["Time Frames"]
    ? filters["Time Frames"].split("-").map((y) => parseInt(y.trim()))
    : [2020, 2059];

  console.log("futureStart:", futureStart, "futureEnd:", futureEnd);

  const baseParams = {
    index: filters["Drought Index"]?.toLowerCase(),
    data_source: filters["Source"]?.toLowerCase(),
    scenario: filters["Scenario"]?.toLowerCase().replace(/[.\-]/g, ""),
    threshold: parseFloat(filters["Threshold"]) || -1,
  };
  
  console.log("baseParams:", baseParams);

  let endpoint = "drought-event-count";
  if (filters["Definition"] === "Change in Length") {
    endpoint = "drought-month-count";
  }
  console.log("endpoint:", endpoint);

  // 获取对应的模型
  const models = getModels(filters["Source"]);

  const regionDiffs = await Promise.all(
    regions.map(async ({ region_id }) => {
      const baselineDataAllModels = [];
      const futureDataAllModels = [];

      // 为每个模型获取数据
      for (const model of models) {
        const baselinePayload = {
          ...baseParams,
          region_id,
          model,  // 使用不同的模型
          start_year: 1976,
          end_year: 2005,
        };

        const futurePayload = {
          ...baseParams,
          region_id,
          model,  // 使用不同的模型
          start_year: futureStart,
          end_year: futureEnd,
        };

        const [baselineData, futureData] = await Promise.all([
          mapApi.fetchMapData(baselinePayload, endpoint),
          mapApi.fetchMapData(futurePayload, endpoint),
        ]);

        // 根据Definition字段选择不同的数据字段
        let baselineValue = 0;
        let futureValue = 0;
        
        if (filters["Definition"] === "Change in Number") {
          baselineValue = baselineData.drought_events.length; // 对应Change in Number
          futureValue = futureData.drought_events.length;
        } else if (filters["Definition"] === "Change in Length") {
          baselineValue = baselineData.drought_month_count; // 对应Change in Length
          futureValue = futureData.drought_month_count;
        }

        baselineDataAllModels.push(baselineValue);
        futureDataAllModels.push(futureValue);
      }

      // 计算所有模型的平均值
      const avgBaseline = baselineDataAllModels.reduce((acc, val) => acc + val, 0) / models.length;
      const avgFuture = futureDataAllModels.reduce((acc, val) => acc + val, 0) / models.length;

      const diff = avgFuture - avgBaseline;
      return diff;
    })
  );

  console.log("regionDiffs:", regionDiffs);
  return regionDiffs;
};
