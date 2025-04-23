import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Box, Button, Dialog, DialogTitle, DialogContent, Stepper, Step, StepLabel } from "@mui/material";

function TopBar() {
  const [open, setOpen] = useState(false);

  const steps = [
    "Step 1: Select the drought definition (Change in Number or Change in Length).",
    "Step 2: Choose the drought index (SPI, SPEI).",
    "Step 3: Choose the time range (e.g., 2006-2035, 2036-2065).",
    "Step 4: Select the data source (CMIP5 or CMIP6).",
    "Step 5: Based on the selected source, choose a scenario: RCP4.5/RCP8.5 for CMIP5, or SSP1-2.6/SSP3-7.0 for CMIP6.",
    "Step 6: Input a threshold.",
    "Step 7: Click 'Submit Filters' to visualize the drought change on the map.",
    "Step 8: Click a region on the map to view detailed drought statistics.",
    "Step 9: Explore the detail page to compare drought metrics across different models."
  ];

  const handleDialogOpen = () => setOpen(true);
  const handleDialogClose = () => setOpen(false);

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: "100%",
          backgroundColor: "#ffffff",
          color: "#1e78d0",
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center">
            <Box component="img" src="/logo.png" alt="logo" sx={{ height: 40, mr: 2 }} />

            <Typography variant="h6" sx={{ mr: 2, color: "#1e78d0" }}>
              Future Drought Explorer System (baseline: 1976-2005)
            </Typography>

            <Button
              variant="outlined"
              onClick={handleDialogOpen}
              sx={{
                fontSize: "0.85rem",
                textTransform: "none",
                borderColor: "#1e78d0",
                color: "#1e78d0",
                "&:hover": {
                  backgroundColor: "#e3f2fd",
                  borderColor: "#1565c0",
                  color: "#1565c0"
                }
              }}
            >
              How to use it?
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 👇 弹出窗口 */}
      <Dialog open={open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>How to Use the Future Drought Explorer</DialogTitle>
        <DialogContent>
          <Stepper orientation="vertical" activeStep={-1}>
            {steps.map((step, index) => (
              <Step key={index}>
                <StepLabel>{step}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {/* Add Close Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button onClick={handleDialogClose} color="primary">
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TopBar;
