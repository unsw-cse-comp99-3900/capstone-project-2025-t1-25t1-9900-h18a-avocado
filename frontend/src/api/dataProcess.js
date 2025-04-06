import mapApi from "./mapApi";
import regions from "../data/regions";

export const calculateRegionDiffs = async (filters) => {
  console.log("filters:", filters);
  const [futureStart, futureEnd] = filters["Time Frames"]
    ? filters["Time Frames"].split("-").map((y) => parseInt(y.trim()))
    : [2020, 2059];
  console.log("futureStart:", futureStart, "futureEnd:", futureEnd);

  const baseParams = {
    index: filters["Drought Index"]?.toLowerCase(),
    data_source: filters["Source"]?.toLowerCase(),
    scenario: filters["Scenario"]?.toLowerCase().replace(/\./g, ""),
  threshold: parseFloat(filters["Threshold"]) || -1,
  };
  console.log("baseParams:", baseParams);

  let endpoint = "drought-event-count";
  if (filters["Definition"] === "Change in Length") {
    endpoint = "drought-month-count";
  }
  console.log("endpoint:", endpoint);

  const regionDiffs = await Promise.all(
    regions.map(async ({ region_id }) => {
      const baselinePayload = {
        ...baseParams,
        region_id,
        start_year: 1980,
        end_year: 2019,
      };

      const futurePayload = {
        ...baseParams,
        region_id,
        start_year: futureStart,
        end_year: futureEnd,
      };

      const [baselineData, futureData] = await Promise.all([
        mapApi.fetchMapData(baselinePayload, endpoint),
        mapApi.fetchMapData(futurePayload, endpoint),
      ]);

      let diff = 0;
      if (endpoint === "drought-event-count") {
        diff = (futureData.drought_events || []).length - (baselineData.drought_events || []).length;
      } else if (endpoint === "drought-month-count") {
        diff = (futureData.drought_month_count || 0) - (baselineData.drought_month_count || 0);
      }

      return diff;
    })
  );
  console.log("regionDiffs:", regionDiffs);

  return regionDiffs;
};
