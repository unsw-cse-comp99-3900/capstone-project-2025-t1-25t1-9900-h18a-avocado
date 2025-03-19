import React, {useState} from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Box,
} from "@mui/material";
import SettingsInputSvideoIcon from "@mui/icons-material/SettingsInputSvideo";
import ListIcon from "@mui/icons-material/List";
import UpdateIcon from "@mui/icons-material/Update";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SourceIcon from "@mui/icons-material/Source";
import LayersIcon from "@mui/icons-material/Layers";
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

  const handleSelectionChange = (category, value) => {
    setSelectedFilters((prev) => ({ ...prev, [category]: value }));
    if (category === "Source") {
      setSelectedSource(value);
    }
  };

  const handleSubmit = () => {
    console.log("Submitting filters:", selectedFilters);
    onFetchData(selectedFilters); // transer to App.jsx
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": { width: 240, boxSizing: "border-box", marginTop: "70px" },
      }}
    >
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
    </Drawer>
  );
}

export default SideBar;
