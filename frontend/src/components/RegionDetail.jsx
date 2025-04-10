import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import regionApi from '../api/regionApi';

Chart.register(...registerables);

const SCENARIO_DISPLAY_NAMES = {
  rcp45: 'RCP4.5',
  rcp85: 'RCP8.5',
  ssp126: 'SSP1-2.6',
  ssp370: 'SSP3-7.0'
};

const SCENARIO_COLORS = {
  rcp45: 'rgba(75, 192, 192, 0.7)',
  rcp85: 'rgba(255, 99, 132, 0.7)',
  ssp126: 'rgba(54, 162, 235, 0.7)',
  ssp370: 'rgba(255, 159, 64, 0.7)'
};

const RegionDetail = () => {
  const { regionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await regionApi.fetchDroughtData(regionId);
        if (!response?.state) throw new Error("Invalid data format");
        setData(response.state);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [regionId]);

  const calculateAverage = (arr) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);

  const generateBaselineLabels = () => ['1976-1985', '1986-1995', '1996-2005'];

  const generateFutureLabels = (timeFrame) => {
    const startYear = parseInt(timeFrame.substring(0, 4));
    return [
      `${startYear}-${startYear+9}`,
      `${startYear+10}-${startYear+19}`,
      `${startYear+20}-${startYear+29}`
    ];
  };

  const getFutureDatasets = () => {
    if (!data?.futureData) return [];
    const isFrequency = data.filteredFilters.Definition === 'Change in Number';
    return Object.entries(data.futureData).map(([scenario, values]) => ({
      label: SCENARIO_DISPLAY_NAMES[scenario] || scenario,
      data: isFrequency ? values.freq : values.len,
      backgroundColor: SCENARIO_COLORS[scenario] || 'rgba(153, 102, 255, 0.7)'
    }));
  };

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
        title: { display: true, text: data?.filteredFilters?.Definition?.includes('Length') ? 'Days' : 'Count' }
      },
      x: { 
        title: { display: true, text: 'Time Period' }
      }
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>Error: {error}</Alert>;
  if (!data) return <Alert severity="warning" sx={{ mt: 4 }}>No data available</Alert>;

  const { Definition } = data.filteredFilters;
  const avgBaselineFreq = calculateAverage(data.baselineFreq);
  const avgBaselineLen = calculateAverage(data.baselineLen);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Drought Analysis - Region {regionId}
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6"><strong>Index:</strong> {data.filteredFilters['Drought Index']}</Typography>
        <Typography variant="h6"><strong>Source:</strong> {data.filteredFilters.Source}</Typography>
        <Typography variant="h6"><strong>Baseline Period:</strong> 1976-2005</Typography>
        <Typography variant="h6"><strong>Projection Period:</strong> {data.filteredFilters['Time Frames']}</Typography>
      </Paper>

      {Definition === 'Change in Number' && (
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
                    data: data.baselineFreq,
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
                  labels: generateFutureLabels(data.filteredFilters['Time Frames']),
                  datasets: getFutureDatasets()
                }}
                options={chartOptions}
              />
            </Box>
          </Paper>
        </>
      )}

      {Definition === 'Change in Length' && (
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
                    data: data.baselineLen,
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
                  labels: generateFutureLabels(data.filteredFilters['Time Frames']),
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