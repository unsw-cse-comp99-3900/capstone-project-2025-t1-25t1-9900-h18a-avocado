import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { Box, Typography, Paper } from '@mui/material';
import { useLocation } from 'react-router-dom';

Chart.register(...registerables);

// 场景显示名称映射
const SCENARIO_DISPLAY_NAMES = {
  rcp45: 'RCP4.5',
  rcp85: 'RCP8.5',
  ssp126: 'SSP1-2.6',
  ssp370: 'SSP3-7.0'
};

// 场景颜色配置
const SCENARIO_COLORS = {
  rcp45: 'rgba(75, 192, 192, 0.7)',
  rcp85: 'rgba(255, 99, 132, 0.7)',
  ssp126: 'rgba(54, 162, 235, 0.7)',
  ssp370: 'rgba(255, 159, 64, 0.7)'
};

const RegionDetail = () => {
  const { state } = useLocation();
  const { 
    filters, 
    futureData, 
    baselineFreq, 
    baselineLen 
  } = state || {};

  // 计算基准期平均值
  const calculateAverage = (arr) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
  const avgBaselineFreq = calculateAverage(baselineFreq);
  const avgBaselineLen = calculateAverage(baselineLen);

  // 生成时间标签
  const generateBaselineLabels = () => ['1976-1985', '1986-1995', '1996-2005'];
  const generateFutureLabels = () => {
    const [startYear] = filters['Time Frames'].split('-').map(Number);
    return [
      `${startYear}-${startYear+9}`,
      `${startYear+10}-${startYear+19}`,
      `${startYear+20}-${startYear+29}`
    ];
  };

  // 获取未来数据集
  const getFutureDatasets = () => {
    if (!futureData) return [];
    const scenarios = Object.keys(futureData);
    const isFrequency = filters.Definition === 'Change in Number';
    
    return scenarios.map(scenario => ({
      label: SCENARIO_DISPLAY_NAMES[scenario] || scenario,
      data: isFrequency ? futureData[scenario].freq : futureData[scenario].len,
      backgroundColor: SCENARIO_COLORS[scenario] || 'rgba(153, 102, 255, 0.7)'
    }));
  };

  // 图表配置
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: filters.Definition.includes('Length') ? 'Days' : 'Count'
        }
      },
      x: {
        title: { display: true, text: 'Time Period' }
      }
    }
  };

  if (!state) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">No region data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Drought Analysis - Region {state.regionId}
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">
          <strong>Index:</strong> {filters['Drought Index']}
        </Typography>
        <Typography variant="h6">
          <strong>Source:</strong> {filters.Source}
        </Typography>
        <Typography variant="h6">
          <strong>Baseline Period:</strong> 1976-2005
        </Typography>
        <Typography variant="h6">
          <strong>Projection Period:</strong> {filters['Time Frames']}
        </Typography>
      </Paper>

      {filters.Definition === 'Change in Number' ? (
        <>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Average number of drought months in the baseline period: {avgBaselineFreq}
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar
                data={{
                  labels: generateBaselineLabels(),
                  datasets: [{
                    label: 'Historical Frequency',
                    data: baselineFreq,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)'
                  }]
                }}
                options={chartOptions}
              />
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Projected change in drought events
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar
                data={{
                  labels: generateFutureLabels(),
                  datasets: getFutureDatasets()
                }}
                options={chartOptions}
              />
            </Box>
          </Paper>
        </>
      ) : (
        <>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Average drought length in the baseline period: {avgBaselineLen}
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar
                data={{
                  labels: generateBaselineLabels(),
                  datasets: [{
                    label: 'Historical Duration',
                    data: baselineLen,
                    backgroundColor: 'rgba(255, 159, 64, 0.7)'
                  }]
                }}
                options={chartOptions}
              />
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Projected change in drought length
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar
                data={{
                  labels: generateFutureLabels(),
                  datasets: getFutureDatasets()
                }}
                options={chartOptions}
              />
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default RegionDetail;