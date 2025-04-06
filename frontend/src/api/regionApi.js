const API_BASE_URL = "http://localhost:9901";

/**
 * send POST request
 * @param {string} endpoint API path
 * @param {object} payload request data
 * @returns {Promise<object>} return JSON data
 */
const postRequest = async (endpoint, payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    console.error("API request error:", error);
    return { success: false, message: "request failed", error };
  }
};

/**
 * gain drought data of a region
 * @param {string} regionId region ID
 * @returns {Promise<object>} return drought data of the region
 */
export const fetchDroughtData = async (regionId) => {
  const requestData = {
    region_id: regionId
  };

  return await postRequest("region-table", requestData);
};

export default {
  fetchDroughtData,
};
