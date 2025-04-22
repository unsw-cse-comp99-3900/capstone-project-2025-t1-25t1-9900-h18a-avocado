import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { Box, Typography, Paper } from '@mui/material';
import { useLocation } from 'react-router-dom';

Chart.register(...registerables);

const MODEL_NAMES = {
  model1: 'Model A',
  model2: 'Model B', 
  model3: 'Model C',
  model4: 'Model D',
  model5: 'Model E'
};

const SCENARIO_CONFIG = {
  rcp45: { name: 'RCP4.5', color: 'rgba(75, 192, 192, 0.7)' },
  rcp85: { name: 'RCP8.5', color: 'rgba(255, 99, 132, 0.7)' },
  ssp126: { name: 'SSP1-2.6', color: 'rgba(54, 162, 235, 0.7)' },
  ssp370: { name: 'SSP3-7.0', color: 'rgba(255, 159, 64, 0.7)' }
};

const RegionDetail = () => {
  const { state } = useLocation();
  const { 
    filters = {}, 
    stats = {} 
  } = state || {};

  // Get region info and data from stats
  const { region_id, region_name, baselineData, futureData } = stats;

  // Process model data
  const processModelData = () => {
    if (!baselineData || !futureData) return { models: [], scenarios: [] };
    
    const scenarios = Object.keys(futureData);
    const firstScenario = scenarios[0];
    const models = Object.keys(baselineData[firstScenario] || {});
    
    return { models, scenarios };
  };

  // Calculate percentage change (future number / baseline number - 1) * 100
  const calculatePercentageChange = (baselineNum, futureNum) => {
    if (!baselineNum || baselineNum === 0) return 0;
    return ((futureNum / baselineNum - 1) * 100).toFixed(1);
  };

  // Calculate absolute difference (future - baseline)
  const calculateAbsoluteDifference = (baselineNum, futureNum) => {
    return futureNum - baselineNum;
  };

  // Get the appropriate data value based on Definition
  const getDataValue = (dataObj, isEvents) => {
    return isEvents 
      ? dataObj?.drought_events?.length || 0
      : dataObj?.drought_months_details?.length || 0;
  };

  // Generate chart data
  const generateChartData = (type) => {
    const { models, scenarios } = processModelData();
    const isPercentage = type === 'percentage';
    const isEvents = filters.Definition === 'Change in Number';
    
    return {
      labels: models.map(model => MODEL_NAMES[model] || model),
      datasets: scenarios.map(scenario => {
        const config = SCENARIO_CONFIG[scenario] || { 
          name: scenario, 
          color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)` 
        };
        
        return {
          label: config.name,
          backgroundColor: config.color,
          data: models.map(model => {
            const baselineValue = getDataValue(baselineData[scenario]?.[model], isEvents);
            const futureValue = getDataValue(futureData[scenario]?.[model], isEvents);
            
            return isPercentage 
              ? calculatePercentageChange(baselineValue, futureValue)
              : calculateAbsoluteDifference(baselineValue, futureValue);
          })
        };
      })
    };
  };

  // Calculate axis range with proper rounding for negative values
  const calculateAxisRange = (data) => {
    const allValues = data.datasets.flatMap(d => d.data);
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    
    // Round to nearest 10, handling negative values properly
    const roundToNearest10 = (num) => {
      return Math.sign(num) * Math.ceil(Math.abs(num) / 10) * 10;
    };
    
    return {
      min: min < 0 ? roundToNearest10(min) : 0,
      max: roundToNearest10(max)
    };
  };

  // Generate chart options
  const getChartOptions = (isPercentage) => {
    const data = generateChartData(isPercentage ? 'percentage' : 'absolute');
    const { min, max } = calculateAxisRange(data);
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: {
          min,
          max,
          title: {
            display: true,
            text: isPercentage ? 'Percentage Change (%)' : 
                  filters.Definition === 'Change in Number' ? 'Change in Number of Events' : 'Change in Duration (Months)'
          }
        },
        x: {
          title: { display: true, text: 'Climate Models' }
        }
      }
    };
  };

  if (!state) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">No region data available</Typography>
      </Box>
    );
  }

  const chartTitle = filters.Definition === 'Change in Number' 
    ? 'Projected change in number of events' 
    : 'Projected change in drought length';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Drought Analysis - {region_name || `Region ${region_id}`}
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">
          <strong>Index:</strong> {filters.Drought_Index}
        </Typography>
        <Typography variant="h6">
          <strong>Source:</strong> {filters.Source}
        </Typography>
        <Typography variant="h6">
          <strong>Baseline Period:</strong> 1976-2005
        </Typography>
        <Typography variant="h6">
          <strong>Projection Period:</strong> {filters.Time_Frames}
        </Typography>
      </Paper>

      {/* Percentage change chart */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          {chartTitle} (%)
        </Typography>
        <Box sx={{ height: 500 }}>
          <Bar
            data={generateChartData('percentage')}
            options={getChartOptions(true)}
          />
        </Box>
      </Paper>

      {/* Absolute difference chart (future - baseline) */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          {chartTitle} (Difference)
        </Typography>
        <Box sx={{ height: 500 }}>
          <Bar
            data={generateChartData('absolute')}
            options={getChartOptions(false)}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default RegionDetail;