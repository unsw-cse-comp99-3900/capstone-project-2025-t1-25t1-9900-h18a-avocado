import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { Box, Typography, Paper } from '@mui/material';
import { useLocation } from 'react-router-dom';

// Register Chart.js components
Chart.register(...registerables);

// Mapping of model IDs to display names
const MODEL_NAMES = {
  model1: 'Model A',
  model2: 'Model B', 
  model3: 'Model C',
  model4: 'Model D',
  model5: 'Model E'
};

// Configuration for different climate scenarios (colors and display names)
const SCENARIO_CONFIG = {
  rcp45: { name: 'RCP4.5', color: 'rgba(75, 192, 192, 0.7)' },
  rcp85: { name: 'RCP8.5', color: 'rgba(255, 99, 132, 0.7)' },
  ssp126: { name: 'SSP1-2.6', color: 'rgba(54, 162, 235, 0.7)' },
  ssp370: { name: 'SSP3-7.0', color: 'rgba(255, 159, 64, 0.7)' }
};

const RegionDetail = () => {
  // Get state from route location
  const { state } = useLocation();
  const { 
    filters = {}, 
    stats = {}, 
    region_id,
    region_name 
  } = state || {};

  // Process model data to extract available models and scenarios
  const processModelData = () => {
    if (!stats.baselineData || !stats.futureData) return { models: [], scenarios: [] };
    
    // Get all model names from the first scenario in baselineData
    const firstScenario = Object.keys(stats.baselineData)[0];
    const models = Object.keys(stats.baselineData[firstScenario] || {});
    
    // Get all available scenarios
    const scenarios = Object.keys(stats.futureData);
    
    return { models, scenarios };
  };

  // Calculate percentage change between baseline and future data
  const calculatePercentageChange = (baseline, future) => {
    if (!baseline || baseline.length === 0) return 0;
    const baseAvg = baseline.reduce((a, b) => a + b, 0) / baseline.length;
    const futureAvg = future.reduce((a, b) => a + b, 0) / future.length;
    return ((futureAvg - baseAvg) / baseAvg * 100).toFixed(1);
  };

  // Generate chart data based on type (percentage or absolute values)
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
            const baseline = stats.baselineData[scenarios[0]]?.[model]?.drought_events || [];
            const future = stats.futureData[scenario]?.[model]?.drought_events || [];
            
            return isPercentage 
              ? calculatePercentageChange(baseline, future)
              : future.length; // For absolute values, use the count directly
          })
        };
      })
    };
  };

  // Calculate dynamic axis range based on data values
  const calculateAxisRange = (data, isPercentage = false) => {
    const allValues = data.datasets.flatMap(d => d.data);
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    
    return {
      min: isPercentage ? Math.floor(min / 10) * 10 : 0, // Round down to nearest 10 for percentages
      max: isPercentage ? Math.ceil(max / 10) * 10 : Math.ceil(max / 10) * 10 // Round up to nearest 10
    };
  };

  // Generate chart options configuration
  const getChartOptions = (isPercentage) => {
    const data = generateChartData(isPercentage ? 'percentage' : 'absolute');
    const { min, max } = calculateAxisRange(data, isPercentage);
    
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
                  filters.Definition === 'Change in Number' ? 'Number of Events' : 'Duration (Months)'
          }
        },
        x: {
          title: { display: true, text: 'Climate Models' }
        }
      }
    };
  };

  // Handle missing state
  if (!state) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">No region data available</Typography>
      </Box>
    );
  }

  // Determine chart title based on filter definition
  const chartTitle = filters.Definition === 'Change in Number' 
    ? 'Projected change in number of events' 
    : 'Projected change in drought length';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Main title showing region name or fallback to region ID */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Drought Analysis - {region_name || `Region ${region_id}`}
      </Typography>
      
      {/* Information card showing key parameters */}
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

      {/* Absolute values chart */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          {chartTitle} ({filters.Definition === 'Change in Number' ? 'number' : 'month'})
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