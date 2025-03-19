import React, { useState } from "react";
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  List,
  MenuItem,
  Select
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

// Define dropdown options
const dropDownContent = {
  "Definition": {
    options: ["", "Change in Number", "Change in Length"]
  },
  "Drought Index": {
    options: ["", "SPI", "SPEI", "PDSI"]
  },
  "Time Frames": {
    options: ["", "2020-2059", "2040-2079", "2060-2099"]
  },
  "Source": {
    options: ["", "CMIP5", "CMIP6"]
  },
  "Scenario": {
    options: ["", "RCP4.5", "RCP8.5"]
  }
};

const DropDown = ({ label, icon, onSelectionChange }) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(dropDownContent[label]?.options[0] || "");

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleDropdownChange = (event) => {
    setSelectedValue(event.target.value);
    onSelectionChange(label, event.target.value); // ✅ 通知父组件
  };

  return (
    <>
      {/* MenuItem with dropdown */}
      <ListItem button onClick={handleToggle}>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={label} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>

      {/* Render dropdown menu */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: 4 }}>
          <ListItem>
            <Select value={selectedValue} onChange={handleDropdownChange} fullWidth>
              {dropDownContent[label]?.options.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </ListItem>
        </List>
      </Collapse>
    </>
  );
};

export default DropDown;