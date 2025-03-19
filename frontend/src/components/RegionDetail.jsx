import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { useParams } from "react-router-dom";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";

Chart.register(...registerables);

const fetchData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        year: [1980, 1990, 2000, 2010],
        drought_months: [12, 14, 16, 18],
        drought_length: [8, 9, 10, 11],
        drought_events: {
          "1980-2019": 7,
          "2020-2029": 3,
          "2030-2039": 4,
          "2040-2049": 5,
          "2050-2059": 4,
          "2060-2069": 3,
          "2070-2079": 2,
          "2080-2089": 3,
          "2090-2099": 4
        }
      });
    }, 1000);
  });
};

const RegionDetail = () => {
  const { regionId } = useParams();
  const [data, setData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("2020-2059");
  const [selectedPeriod2, setSelectedPeriod2] = useState("2020-2059");

  useEffect(() => {
    fetchData().then((response) => setData(response));
  }, []);

  if (!data) {
    return <Typography variant="h4">Loading data...</Typography>;
  }

  const avgDroughtMonths = (data.drought_months.reduce((a, b) => a + b, 0) / data.drought_months.length).toFixed(2);
  const avgDroughtLength = (data.drought_length.reduce((a, b) => a + b, 0) / data.drought_length.length).toFixed(2);

  return (
    <Box sx={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      <Typography variant="h3">Drought Analysis - Region {regionId}</Typography>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5">Average number of drought months in the baseline period: {avgDroughtMonths}</Typography>
        <Line
          data={{
            labels: data.year.map((year) => `${year}-${year + 9}`),
            datasets: [
              {
                label: "Drought Months",
                data: data.drought_months,
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 2,
                fill: false
              }
            ]
          }}
        />
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5">Average drought length in the baseline period: {avgDroughtLength}</Typography>
        <Line
          data={{
            labels: data.year.map((year) => `${year}-${year + 9}`),
            datasets: [
              {
                label: "Drought Length",
                data: data.drought_length,
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 2,
                fill: false
              }
            ]
          }}
        />
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5">Projected change in the number of drought events</Typography>
        <Line
          data={{
            labels: Object.keys(data.drought_events),
            datasets: [
              {
                label: "Drought Events",
                data: Object.values(data.drought_events),
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 2,
                fill: false
              }
            ]
          }}
        />
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5">Projected change in drought length</Typography>
        <Line
          data={{
            labels: Object.keys(data.drought_events),
            datasets: [
              {
                label: "Drought Length Change",
                data: Object.values(data.drought_events),
                borderColor: "rgba(255, 159, 64, 1)",
                borderWidth: 2,
                fill: false
              }
            ]
          }}
        />
      </Box>

      <Button sx={{ mt: 4 }} variant="contained" onClick={() => window.location.reload()}>
        Refresh Data
      </Button>
    </Box>
  );
};

export default RegionDetail;
