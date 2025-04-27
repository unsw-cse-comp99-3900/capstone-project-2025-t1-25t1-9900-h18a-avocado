import mapApi from "./mapApi";

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

  let endpoint = "drought-event-summary";
  if (filters["Definition"] === "Change in Length") {
    endpoint = "drought-months-summary";
  }
  console.log("endpoint:", endpoint);

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
  console.log("baselineData:", baselineData);
  console.log("futureData:", futureData);

  const diffs = baselineData.drought_summary.map((data, index) => {
    const futureValue = futureData.drought_summary[index];
    return futureValue - data;
  });

  console.log("diffs:", diffs);
  return diffs;
};
