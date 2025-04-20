const API_BASE_URL = "http://127.0.0.1:9901/drought";

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

export const fetchDroughtEvents = async (payload) => {
  return await postRequest("drought-event-count", payload);
};

export const fetchDroughtMonths = async (payload) => {
  return await postRequest("drought-months-details", payload);
};

export default {
  fetchDroughtEvents,
  fetchDroughtMonths,
};
