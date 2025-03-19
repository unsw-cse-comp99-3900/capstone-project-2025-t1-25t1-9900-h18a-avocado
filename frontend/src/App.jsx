import React, {useState} from "react";
import { Box } from "@mui/material";
import "./App.css";
import TopBar from "./components/TopBar";
import SideBar from "./components/SideBar";
import Map from "./components/Map";
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
    <Box display="flex" flexDirection="column" height="100vh">
      <TopBar />
      <Box display="flex" flexGrow={1}>
        <SideBar onFetchData={handleFetchMapData} />
        <Box flexGrow={1}>
          <Map mapData={mapData} />
        </Box>
      </Box>
    </Box>
  );
}

export default App;
