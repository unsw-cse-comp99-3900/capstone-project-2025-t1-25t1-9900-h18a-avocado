import regionApi from "./regionApi";
import regions from "../data/regions";

// define CMIP5 and CMIP6 models
const CMIP5_MODELS = [
  'CCCma-CanESM2', 'NCC-NorESM1-M', 'CSIRO-BOM-ACCESS1-0', 
  'MIROC-MIROC5', 'NOAA-GFDL-GFDL-ESM2M'
];

const CMIP6_MODELS = [
  'ACCESS-CM2', 'ACCESS-ESM1-5', 'CESM2', 'CNRM-ESM2-1', 'CMCC-ESM2'
];

// function for gaining the model
const getModels = (source) => {
  return source === 'CMIP5' ? CMIP5_MODELS : CMIP6_MODELS;
};

const getRegionName = (regionId) => {
  const numericId = parseInt(regionId);
  const region = regions.find(r => r.region_id === numericId);
  return region ? region.region_name : "Unknown Region";
};

// gain the original data: return the baseline and future data of all models
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

  // use the model name as the key of data
  const baselineDataByScenario = {};
  const futureDataByScenario = {};

  // iterate over scenarios
  const scenarios = filters["Source"] === "CMIP5" ? ["rcp45", "rcp85"] : ["ssp126", "ssp370"];

  for (const scenario of scenarios) {
    // create payload for each scenario
    const baselineDataByModel = {};
    const futureDataByModel = {};

    // gain the original data of each model
    for (const model of models) {
      const baselinePayload = {
        ...baseParams,
        region_id: regionId,
        model,
        scenario,
        start_year: 1976,
        end_year: 2005,
      };

      const futurePayload = {
        ...baseParams,
        region_id: regionId,
        model,
        scenario,
        start_year: futureStart,
        end_year: futureEnd,
      };

      // decide which API to call based on Definition
      const fetchDroughtData = filters["Definition"] === "Change in Number"
        ? regionApi.fetchDroughtEvents
        : regionApi.fetchDroughtMonths;

      const [baselineData, futureData] = await Promise.all([
        fetchDroughtData(baselinePayload),
        fetchDroughtData(futurePayload),
      ]);

      // use model name as key to store data
      baselineDataByModel[model] = baselineData;
      futureDataByModel[model] = futureData;
    }
    // use scenario as key to store all models data under this scenario
    baselineDataByScenario[scenario] = baselineDataByModel;
    futureDataByScenario[scenario] = futureDataByModel;
  }
  // gain the region name from regions.js
  const regionName = getRegionName(regionId);

  // return the data of the baseline and future data of this region, using the model name as the key
  return {
    region_id: regionId,
    region_name: regionName,
    baselineData: baselineDataByScenario,
    futureData: futureDataByScenario,
  };
};
