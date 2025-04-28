import { fetchRegionStats } from '../../api/dataStats';
import regionApi from '../../api/regionApi';

jest.mock('../../api/regionApi');

describe('fetchRegionStats', () => {
  const mockFilters = {
    "Definition": "Change in Number",
    "Drought Index": "SPI",
    "Time Frames": "2006-2035",
    "Source": "CMIP5",
    "Scenario": "RCP4.5",
    "Threshold": "-1"
  };
  const mockRegionId = 1010;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches baseline and future drought event counts correctly', async () => {
    const mockBaselineData = { drought_events: [{}, {}] }; // 2 events
    const mockFutureData = { drought_events: [{}, {}, {}] }; // 3 events

    // CMIP5 有5个模型，每个模型 baseline 和 future
    regionApi.fetchDroughtEvents
      .mockResolvedValueOnce(mockBaselineData)
      .mockResolvedValueOnce(mockFutureData)
      .mockResolvedValueOnce(mockBaselineData)
      .mockResolvedValueOnce(mockFutureData)
      .mockResolvedValueOnce(mockBaselineData)
      .mockResolvedValueOnce(mockFutureData)
      .mockResolvedValueOnce(mockBaselineData)
      .mockResolvedValueOnce(mockFutureData)
      .mockResolvedValueOnce(mockBaselineData)
      .mockResolvedValueOnce(mockFutureData);

    const result = await fetchRegionStats(mockFilters, mockRegionId);

    expect(result).toHaveProperty('region_id', mockRegionId);
    expect(result).toHaveProperty('baselineData');
    expect(result).toHaveProperty('futureData');

    // baselineData 应该有两个 scenario: rcp45, rcp85
    expect(Object.keys(result.baselineData)).toContain('rcp45');
    expect(Object.keys(result.baselineData)).toContain('rcp85');

    // 每个 scenario 下 baselineData 应该有5个模型
    expect(Object.keys(result.baselineData['rcp45'])).toHaveLength(5);
    expect(Object.keys(result.futureData['rcp45'])).toHaveLength(5);

    // 断言regionApi调用了10次（5个模型 baseline + future）
    expect(regionApi.fetchDroughtEvents).toHaveBeenCalledTimes(20);
  });

  test('handles Change in Length scenario correctly', async () => {
    const filters = { ...mockFilters, Definition: "Change in Length", Source: "CMIP6" };
    
    regionApi.fetchDroughtMonths.mockResolvedValue({ drought_months_details: [{}, {}] });

    const result = await fetchRegionStats(filters, mockRegionId);

    expect(regionApi.fetchDroughtMonths).toHaveBeenCalled();
    expect(Object.keys(result.baselineData)).toContain('ssp126');
    expect(Object.keys(result.baselineData)).toContain('ssp370');
  });
});
