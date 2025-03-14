import React from "react";
import { Box } from "@mui/material";
import "./App.css";
import TopBar from "./components/TopBar";
import SideBar from "./components/SideBar";
import Map from "./components/Map";

function App() {
  return (
    <Box display="flex" flexDirection="column" height="100vh">
      {/* Topbar */}
      <TopBar />

      <Box display="flex" flexGrow={1}>
        {/* Sidebar */}
        <SideBar />
        {/* Map */}
        <Box flexGrow={1}>
          <Map />
        </Box>
      </Box>
    </Box>
  );
}

export default App;
