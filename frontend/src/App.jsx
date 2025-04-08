import React, { useState } from "react";
import { Box } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import TopBar from "./components/TopBar";
import SideBar from "./components/SideBar";
import Map from "./components/Map";
import RegionDetail from "./components/RegionDetail";
import { calculateRegionDiffs } from "./api/dataProcess";

function App() {
  const [mapData, setMapData] = useState(null);
  const handleFetchMapData = async (filters) => {
    try {
      const regionDiffs = await calculateRegionDiffs(filters);
      setMapData({ received_data: regionDiffs });
    } catch (error) {
      console.error("Error fetching map data:", error);
    }
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Box display="flex" flexDirection="column" height="100vh">
              <TopBar />
              <Box display="flex" flexGrow={1}>
                <SideBar onFetchData={handleFetchMapData} />
                <Box flexGrow={1}>
                  <Map mapData={mapData} />
                </Box>
              </Box>
            </Box>
          }
        />
        <Route path="/region/:regionId" element={<RegionDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
