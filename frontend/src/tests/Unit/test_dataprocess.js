import { calculateRegionDiffs } from '../../api/dataProcess';
import mapApi from '../../api/mapApi';

jest.mock('../../api/mapApi');

describe('calculateRegionDiffs', () => {
  const mockFilters = {
    "Definition": "Change in Number",
    "Drought Index": "SPI",
    "Time Frames": "2006-2035",
    "Source": "CMIP5",
    "Scenario": "RCP4.5",
    "Threshold": "-1"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calculates diffs correctly with valid baseline and future data', async () => {
    // Mock baseline and future data
    const baselineData = { drought_summary: [10, 20, 30] };
    const futureData = { drought_summary: [15, 25, 40] };
    
    mapApi.fetchMapData
      .mockResolvedValueOnce(baselineData) // baseline
      .mockResolvedValueOnce(futureData);  // future

    const diffs = await calculateRegionDiffs(mockFilters);

    expect(diffs).toEqual([5, 5, 10]);
    expect(mapApi.fetchMapData).toHaveBeenCalledTimes(2);
  });

  test('returns empty array if baseline or future data missing', async () => {
    mapApi.fetchMapData
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(calculateRegionDiffs(mockFilters)).rejects.toThrow();
  });

  test('constructs correct API payloads', async () => {
    const dummyResponse = { drought_summary: [0, 0, 0] };
    mapApi.fetchMapData
      .mockResolvedValueOnce(dummyResponse)
      .mockResolvedValueOnce(dummyResponse);

    await calculateRegionDiffs(mockFilters);

    expect(mapApi.fetchMapData).toHaveBeenCalledWith(expect.objectContaining({
      index: 'spi',
      data_source: 'cmip5',
      scenario: 'rcp45',
      threshold: -1,
      start_year: 1976,
      end_year: 2005
    }), expect.any(String));

    expect(mapApi.fetchMapData).toHaveBeenCalledWith(expect.objectContaining({
      start_year: 2006,
      end_year: 2035
    }), expect.any(String));
  });
});
