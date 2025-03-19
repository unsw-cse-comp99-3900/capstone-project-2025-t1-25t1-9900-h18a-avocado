const API_BASE_URL = "http://localhost:9901";

/**
 * send GET request
 * @param {string} endpoint API path
 * @returns {Promise<object>} return JSON data
 */
const getRequest = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    return await response.json();
  } catch (error) {
    console.error("API request error:", error);
    return { success: false, message: "request failed", error };
  }
};

/**
 * gain detailed data for a region
 * @param {string} regionId region ID
 * @returns {Promise<object>} return drought details data for the region
 */
export const fetchDroughtData = async (regionId) => {
  return await getRequest(`drought-data/region/${regionId}`);
};

export default {
  fetchDroughtData
};
