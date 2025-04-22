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

  // Get region info from stats
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
            // Get the array length (number) from both datasets
            const baselineNum = baselineData[scenario]?.[model]?.drought_events?.length || 0;
            const futureNum = futureData[scenario]?.[model]?.drought_events?.length || 0;
            
            return isPercentage 
              ? calculatePercentageChange(baselineNum, futureNum)
              : futureNum;
          })
        };
      })
    };
  };

  // Calculate axis range
  const calculateAxisRange = (data, isPercentage = false) => {
    const allValues = data.datasets.flatMap(d => d.data);
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    
    return {
      min: isPercentage ? Math.floor(min / 10) * 10 : 0,
      max: isPercentage ? Math.ceil(max / 10) * 10 : Math.ceil(max / 10) * 10
    };
  };

  // Generate chart options
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
      {/* Fixed region name display */}
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

      {/* Percentage change chart - now correctly showing data */}
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