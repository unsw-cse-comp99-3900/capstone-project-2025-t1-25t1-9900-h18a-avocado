import React, { useState, useEffect } from "react";
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
    options: ["", "Change in Length", "Change in Number"]
  },
  "Drought Index": {
    options: ["", "SPI", "SPEI"]
  },
  "Time Frames": {
    options: ["", "2006-2035", "2036-2065", "2066-2095"]
  },
  "Source": {
    options: ["", "CMIP5", "CMIP6"]
  }
};

const getScenarioOptions = (selectedSource) => {
  if (selectedSource === "CMIP6") {
    return ["", "SSP1-2.6", "SSP3-7.0"];
  }
  return ["", "RCP4.5", "RCP8.5"];
};

const DropDown = ({ label, icon, onSelectionChange, selectedSource }) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");

  useEffect(() => {
    if (label === "Scenario") {
      setSelectedValue("");
    }
  }, [selectedSource]);

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleDropdownChange = (event) => {
    setSelectedValue(event.target.value);
    onSelectionChange(label, event.target.value);
  };

  const options =
    label === "Scenario"
      ? getScenarioOptions(selectedSource)
      : dropDownContent[label]?.options || [""];

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
              {options.map((option, index) => (
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
