import mapApi from "./mapApi";

/**
 * Calculates the difference in drought indices between baseline and future periods.
 * @param {Object} filters - The filters containing the parameters for the calculation.
 * @param {string} filters.Drought_Index - The drought index to use (e.g., "SPI", "SPEI").
 * @param {string} filters.Source - The data source (e.g., "CMIP5", "CMIP6").
 * @param {string} filters.Scenario - The scenario to use (e.g., "RCP4.5", "RCP8.5").
 * @param {string} filters.Threshold - The threshold value for the drought index.
 * @param {string} filters.Time_Frames - The time frames for the calculation (e.g., "2006-2035").
 * @param {string} filters.Definition - The definition of the drought event (e.g., "Change in Number").
 * @returns {Promise<Array>} - A promise that resolves to an array of differences between baseline and future drought indices.
**/

export const calculateRegionDiffs = async (filters) => {
  const [futureStart, futureEnd] = filters["Time Frames"]
    ? filters["Time Frames"].split("-").map((y) => parseInt(y.trim()))
    : [2020, 2059];

  const baseParams = {
    index: filters["Drought Index"]?.toLowerCase(),
    data_source: filters["Source"]?.toLowerCase(),
    scenario: filters["Scenario"]?.toLowerCase().replace(/[.\-]/g, ""),
    threshold: parseFloat(filters["Threshold"]) || -1,
  };

  let endpoint = "drought-event-summary";
  if (filters["Definition"] === "Change in Length") {
    endpoint = "drought-months-summary";
  }

  const baselinePayload = {
    ...baseParams,
    start_year: 1976,
    end_year: 2005,
  };

  const futurePayload = {
    ...baseParams,
    start_year: futureStart,
    end_year: futureEnd,
  };

  const [baselineData, futureData] = await Promise.all([
    mapApi.fetchMapData(baselinePayload, endpoint),
    mapApi.fetchMapData(futurePayload, endpoint),
  ]);

  const diffs = baselineData.drought_summary.map((data, index) => {
    const futureValue = futureData.drought_summary[index];
    return futureValue - data;
  });

  return diffs;
};
