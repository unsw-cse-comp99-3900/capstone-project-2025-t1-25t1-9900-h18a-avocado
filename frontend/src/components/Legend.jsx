import React from 'react';
import { Box, Typography } from '@mui/material';

const Legend = () => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 80,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: 2,
        borderRadius: 1,
        boxShadow: 2,
        zIndex: 1000,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Drought Change</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ width: 20, height: 20, backgroundColor: 'green', mr: 1 }} />
        <Typography variant="body2">Positive Change</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ width: 20, height: 20, backgroundColor: 'red', mr: 1 }} />
        <Typography variant="body2">Negative Change</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: 20, height: 20, backgroundColor: 'gray', mr: 1 }} />
        <Typography variant="body2">No Change</Typography>
      </Box>
    </Box>
  );
};

export default Legend;
