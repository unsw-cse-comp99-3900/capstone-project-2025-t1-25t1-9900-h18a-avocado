const API_BASE_URL = "http://locolhost:9900";

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
 * gain map data (drought change)
 * @param {object} filters selected filters
 * @returns {Promise<object>} return drought map data
 */
export const fetchMapData = async (filters) => {
  return await postRequest("drought-data", filters);
};

export default {
  fetchMapData
};
