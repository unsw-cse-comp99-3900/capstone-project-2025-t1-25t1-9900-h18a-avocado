import React, { useState } from "react";
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Checkbox,
  FormControlLabel,
  List,
  MenuItem,
  Select
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

// Define the dropdown content for different menus
const dropDownContent = {
  "Definition": [
    { label: "Change in Number", type: "checkbox" },
    { label: "Change in Length", type: "checkbox" }
  ],
  "Drought Index": [
    { label: "SPI", type: "checkbox" },
    { label: "SPEI", type: "checkbox" }, 
    { label: "PDSI", type: "checkbox" }
  ],
  "Time Frames": [
    { label: "Baseline", type: "input" },
    { label: "Length", type: "dropdown", options: ["5 years", "10 years", "20 years", "Other"] }
  ],
  "Source": [
    { label: "CMIP5", type: "checkbox" },
    { label: "CMIP6", type: "checkbox" }
  ],
  "Scenario": [
    { label: "RCP4.5", type: "checkbox" },
    { label: "RCP8.5", type: "checkbox" }
  ]
};

const DropDown = ({ label, icon, onSelectionChange }) => {
  const [open, setOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedDropdown, setSelectedDropdown] = useState("5 years");

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleCheckboxChange = (option) => {
    const newSelectedOptions = { ...selectedOptions, [option]: !selectedOptions[option] };
    setSelectedOptions(newSelectedOptions);
    onSelectionChange(label, newSelectedOptions); // notify the change to parent component
  };

  const handleDropdownChange = (event) => {
    setSelectedDropdown(event.target.value);
    onSelectionChange(label, event.target.value); // notify the change to parent component
  };

  return (
    <>
      {/* MenuItem with dropdown */}
      <ListItem button onClick={handleToggle}>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={label} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>

      {/*  Render the corresponding dropdown content */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: 4 }}>
          {dropDownContent[label]?.map((item, index) => {
            if (item.type === "checkbox") {
              return (
                <ListItem key={index}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedOptions[item.label] || false}
                        onChange={() => handleCheckboxChange(item.label)}
                      />
                    }
                    label={item.label}
                  />
                </ListItem>
              );
            } else if (item.type === "dropdown") {
              return (
                <ListItem key={index}>
                  <Select
                    value={selectedDropdown}
                    onChange={handleDropdownChange}
                  >
                    {item.options.map((opt, idx) => (
                      <MenuItem key={idx} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </ListItem>
              );
            }
            return null;
          })}
        </List>
      </Collapse>
    </>
  );
};

export default DropDown;
