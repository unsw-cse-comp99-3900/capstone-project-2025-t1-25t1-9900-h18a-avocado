import React from "react";
import { AppBar, Toolbar, Typography, Box } from "@mui/material";

function TopBar() {
  return (
    <AppBar 
      position="fixed" 
      sx={{
        width: "100%", 
        backgroundColor: "#ffffff", 
        color: "#1e78d0", 
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar>
        <Box component="img" src="/logo.png" alt="logo" sx={{ height: 40, mr: 2 }} />

        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Future Drought Explorer System
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
