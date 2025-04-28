import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Box,
  Divider,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import SettingsInputSvideoIcon from "@mui/icons-material/SettingsInputSvideo";
import ListIcon from "@mui/icons-material/List";
import UpdateIcon from "@mui/icons-material/Update";
import SourceIcon from "@mui/icons-material/Source";
import LayersIcon from "@mui/icons-material/Layers";
import InfoIcon from "@mui/icons-material/Info";
import DropDown from "./DropDown";

const menuItems = [
  { text: "Definition", icon: <SettingsInputSvideoIcon />, dropdown: true },
  { text: "Drought Index", icon: <ListIcon />, dropdown: true },
  { text: "Time Frames", icon: <UpdateIcon />, dropdown: true },
  { text: "Source", icon: <SourceIcon />, dropdown: true },
  { text: "Scenario", icon: <LayersIcon />, dropdown: true },
];

function SideBar({ onFetchData, loading }) {
  const [selectedFilters, setSelectedFilters] = useState({});
  const [selectedSource, setSelectedSource] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState("");
  const [dialogTitle, setDialogTitle] = useState("Explanation");

  const handleSelectionChange = (category, value) => {
    setSelectedFilters((prev) => ({ ...prev, [category]: value }));
    if (category === "Source") {
      setSelectedSource(value);
    }
  };

  const handleSubmit = () => {
    // Check if all required fields are filled
    const missingFields = [];
    if (!selectedFilters["Definition"]) missingFields.push("definition");
    if (!selectedFilters["Drought Index"]) missingFields.push("drought index");
    if (!selectedFilters["Time Frames"]) missingFields.push("time frames");
    if (!selectedFilters["Source"]) missingFields.push("source");
    if (!selectedFilters["Scenario"]) missingFields.push("scenario");

    if (missingFields.length > 0) {
      setDialogTitle("Missing Parameters");
      setDialogContent(`Please select the following fields: ${missingFields.join(", ")}`);
      setOpenDialog(true);
      return;
    }

    // If all fields are selected, proceed to fetch data
    onFetchData(selectedFilters);
  };
  
  const handleOpenDialog = (content, title = "Explanation") => {
    setDialogTitle(title);
    setDialogContent(content);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          boxSizing: "border-box",
          marginTop: "70px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          overflow: "hidden",
        },
      }}
    >
      {/* upper side: Functions */}
      <Box>
        <Typography variant="h6" align="center" sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
          Functions
        </Typography>

        <List>
          {menuItems.map(({ text, icon, dropdown }) =>
            dropdown ? (
              <DropDown key={text} label={text} icon={icon} onSelectionChange={handleSelectionChange} selectedSource={selectedSource} />
            ) : (
              <ListItem button key={text}>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={text} />
              </ListItem>
            )
          )}
        </List>

        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontSize: "1rem" }}>
            Threshold for Drought Index
          </Typography>
          <TextField
            type="number"
            variant="outlined"
            size="small"
            fullWidth
            placeholder="-1"
            onChange={(e) => handleSelectionChange("Threshold", e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fafafa',
                borderRadius: '5px',
                '& fieldset': {
                  borderColor: '#1e78d0',
                },
                '&:hover fieldset': {
                  borderColor: '#1565c0',
                },
              },
              '& .MuiInputBase-input': {
                padding: '10px',
                fontSize: '1rem',
              },
            }}
          />
        </Box>

        <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
          <Button type="button" variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Loading...' : 'Submit Filters'}
          </Button>
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* lower side: Explanations */}
      <Box sx={{ flexGrow: 0, overflow: "auto", p: 2 }}>
        <Typography variant="h6" align="center" sx={{ fontWeight: "bold", mb: 1 }}>
          Explanations
        </Typography>

        <Typography variant="body2" align="center">
          Learn about each of the functions and their specific roles in analyzing drought data.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
          {/* Definition */}
          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() =>
              handleOpenDialog(
                "DEFINITION allows you to select the type of drought change you are analyzing. Options include 'Change in Number' or 'Change in Length', helping determine the method of analysis for drought severity."
              )
            }
          >
            DEFINITION
          </Button>

          {/* Drought Index Explanation */}
          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() =>
              handleOpenDialog(
                "DROUGHT INDEX: SPI (Standard Precipitation Index) is based on precipitation and provides insights into precipitation anomalies over various time scales. SPEI (Standardized Precipitation Evapotranspiration Index) incorporates temperature and precipitation, providing a more comprehensive measure of drought severity."
              )
            }
          >
            DROUGHT INDEX
          </Button>

          {/* Time Frames Explanation */}
          <Button
            variant="outlined"
            type="button"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() =>
              handleOpenDialog(
                "TIME FRAMES allows you to define the period over which the drought analysis will be conducted. It helps select the projection periods to observe future trends and comparisons."
              )
            }
          >
            TIME FRAMES
          </Button>

          {/* Source Explanation */}
          <Button
            variant="outlined"
            type="button"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() =>
              handleOpenDialog(
                "SOURCE refers to the selection of climate models. For CMIP5, the models include 'CCCma-CanESM2', 'NCC-NorESM1-M', 'CSIRO-BOM-ACCESS1-0', 'MIROC-MIROC5', 'NOAA-GFDL-GFDL-ESM2M'. For CMIP6, the models include 'ACCESS-CM2', 'ACCESS-ESM1-5', 'CESM2', 'CNRM-ESM2-1', 'CMCC-ESM2'."
              )
            }
          >
            SOURCE
          </Button>

          {/* Scenario Explanation */}
          <Button
            variant="outlined"
            type="button"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() =>
              handleOpenDialog(
                "SCENARIO refers to the specific emissions or environmental pathways that model future climate projections. For CMIP5, available scenarios are 'RCP4.5' and 'RCP8.5'. For CMIP6, available scenarios are 'SSP1-2.6' and 'SSP3-7.0'."
              )
            }
          >
            SCENARIO
          </Button>

          {/* Threshold Explanation */}
          <Button
            variant="outlined"
            type="button"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() =>
              handleOpenDialog(
                "THRESHOLD determines the sensitivity of the drought index to various conditions. This value can adjust the severity levels, helping in better classification of drought conditions."
              )
            }
          >
            THRESHOLD
          </Button>

        </Box>
      </Box>

      {/* dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Typography variant="body1">{dialogContent}</Typography>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}

export default SideBar;
