import React, { useState } from "react";
import { Box } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import TopBar from "./components/TopBar";
import SideBar from "./components/SideBar";
import Map from "./components/Map";
import RegionDetail from "./components/RegionDetail";
import { calculateRegionDiffs } from "./api/dataProcess";
import Legend from './components/Legend';

function App() {
  const [mapData, setMapData] = useState(null);
  const [filters, setFilters] = useState(null); // ✅ 新增 state 用于存 filters

  const handleFetchMapData = async (filters) => {
    try {
      setFilters(filters); // ✅ 保存 filters
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
              <Legend />
              <Box display="flex" flexGrow={1}>
                <SideBar onFetchData={handleFetchMapData} />
                <Box flexGrow={1}>
                  <Map mapData={mapData} filters={filters} /> {/* ✅ 传 filters */}
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
