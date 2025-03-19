import React, { useState } from "react";
import { Box } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import TopBar from "./components/TopBar";
import SideBar from "./components/SideBar";
import Map from "./components/Map";
import RegionDetail from "./components/RegionDetail";
import mapApi from "./api/mapApi";

function App() {
  const [mapData, setMapData] = useState(null);

  const handleFetchMapData = async (filters) => {
    console.log("Fetching map data with filters:", filters);
    const data = await mapApi.fetchMapData(filters);
    console.log("Map data received:", data);
    setMapData(data); // update map data
  };

  return (
    <Router>
      <Routes>
        {/* 主页：显示地图 */}
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

        {/* 详情页：当点击区域后跳转到 "/region/:id" */}
        <Route path="/region/:regionId" element={<RegionDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
