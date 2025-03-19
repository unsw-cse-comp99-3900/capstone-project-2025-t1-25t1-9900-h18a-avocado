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
  DialogActions
} from "@mui/material";
import SettingsInputSvideoIcon from "@mui/icons-material/SettingsInputSvideo";
import ListIcon from "@mui/icons-material/List";
import UpdateIcon from "@mui/icons-material/Update";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SourceIcon from "@mui/icons-material/Source";
import LayersIcon from "@mui/icons-material/Layers";
import InfoIcon from "@mui/icons-material/Info";
import DropDown from "./DropDown";

const menuItems = [
  { text: "Definition", icon: <SettingsInputSvideoIcon />, dropdown: true },
  { text: "Drought Index", icon: <ListIcon />, dropdown: true },
  { text: "Time Frames", icon: <UpdateIcon />, dropdown: true },
  { text: "Change", icon: <VisibilityIcon />, dropdown: false },
  { text: "Source", icon: <SourceIcon />, dropdown: true },
  { text: "Scenario", icon: <LayersIcon />, dropdown: true },
];

function SideBar({ onFetchData }) {
  const [selectedFilters, setSelectedFilters] = useState({});
  const [selectedSource, setSelectedSource] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState("");

  const handleSelectionChange = (category, value) => {
    setSelectedFilters((prev) => ({ ...prev, [category]: value }));
    if (category === "Source") {
      setSelectedSource(value);
    }
  };

  const handleSubmit = () => {
    console.log("Submitting filters:", selectedFilters);
    onFetchData(selectedFilters);
  };

  const handleOpenDialog = (content) => {
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
          justifyContent: "flex-start", // ✅ 保证内容靠上
          overflow: "hidden", // ✅ 避免溢出
        },
      }}
    >
      {/* ✅ 上半部分：Functions 区域 */}
      <Box> {/* ✅ 让 Functions 占据可用空间 */}
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

        <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Submit Filters
          </Button>
        </Box>
      </Box>

      {/* ✅ 让分割线紧贴 Submit Filters */}
      <Divider sx={{ my: 1 }} />

      {/* ✅ 下半部分：Explanations 区域 */}
      <Box sx={{ flexGrow: 0, overflow: "auto", p: 2 }}> {/* ✅ 让 Explanations 保持固定高度 */}
        <Typography variant="h6" align="center" sx={{ fontWeight: "bold", mb: 1 }}>
          Explanations
        </Typography>

        <Typography variant="body2" align="center">
          Learn about drought indices, calculation methods, and climate models.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() => handleOpenDialog("The Standard Precipitation Index (SPI) is a relatively new drought index based only on precipitation. It's an index based on the probability of precipitation for any time scale.")}
          >
            SPI
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() => handleOpenDialog("The Standardized Precipitation Evapotranspiration Index (SPEI) is a multiscalar drought index based on climatic data. It can be used for determining the onset, duration and magnitude of drought conditions with respect to normal conditions in a variety of natural and managed systems such as crops, ecosystems, rivers, water resources, etc.")}
          >
            SPEI
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() => handleOpenDialog("The Palmer Drought Severity Index (PDSI) is a standardized index based on a simplified soil water balance and estimates relative soil moisture conditions.")}
          >
            PDSI
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() => handleOpenDialog("Calculation Methods: Drought indices are calculated using precipitation, temperature, and other climate factors.")}
          >
            Calculation Methods
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() => handleOpenDialog("Climate Models: Climate models simulate future drought conditions based on different emission scenarios.")}
          >
            Climate Models
          </Button>
        </Box>
      </Box>

      {/* ✅ 弹出对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Explanation</DialogTitle>
        <DialogContent>
          <Typography variant="body1">{dialogContent}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}

export default SideBar;
