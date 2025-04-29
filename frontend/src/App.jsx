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
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetchMapData = async (filters) => {
    setLoading(true);
    try {
      setFilters(filters);
      const regionDiffs = await calculateRegionDiffs(filters);
      setMapData({ received_data: regionDiffs });
>>>>>>> origin/frontend_boxiangxu
    } catch (error) {
      console.error("Error fetching map data:", error);
    } finally {
      setLoading(false);
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
                <SideBar onFetchData={handleFetchMapData} loading={loading} />
                <Box flexGrow={1}>
                  <Map mapData={mapData} filters={filters} />
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
