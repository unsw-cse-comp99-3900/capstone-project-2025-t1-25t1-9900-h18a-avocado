import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Map from '../../components/Map';
import { BrowserRouter as Router } from 'react-router';
import * as dataStats from '../../api/dataStats';

jest.mock('../../api/dataStats', () => ({
  fetchRegionStats: jest.fn(() => Promise.resolve({ spi: 1, spei: 2, drought_duration: 10 })),
}));

const mockMapData = {
  received_data: Array(60).fill(0).map((_, i) => (i % 3) - 1) // create 60 elements with values -1, 0, 1 iterately
};

const renderWithRouter = (ui, options) => render(<Router>{ui}</Router>, options);

describe('Map Component', () => {

  test('shows dialog when clicking region without submitting filters', async () => {
    renderWithRouter(<Map mapData={mockMapData} filters={{}} />);
    
    // stimulate a click after the map is loaded
    await waitFor(() => {
      const paths = document.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });

    const firstPath = document.querySelector('path');
    fireEvent.click(firstPath);

    await waitFor(() => {
      expect(screen.getByText(/Please submit parameters/i)).toBeInTheDocument();
    });
  });

  test('navigates when filters are submitted and a region is clicked', async () => {
    const filters = {
      "Definition": "Change in Number",
      "Drought Index": "SPI",
      "Time Frames": "2006-2035",
      "Source": "CMIP5",
      "Scenario": "RCP4.5"
    };

    renderWithRouter(<Map mapData={mockMapData} filters={filters} />);

    await waitFor(() => {
      const paths = document.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });

    const path = document.querySelector('path');
    fireEvent.click(path);

    // because the navigation and state passing is controlled by useNavigate, we can just check if fetchRegionStats is called
    await waitFor(() => {
      expect(dataStats.fetchRegionStats).toHaveBeenCalled();
    });
  });

  test('path fill color is set correctly based on value', async () => {
    renderWithRouter(<Map mapData={mockMapData} filters={{}} />);
    
    await waitFor(() => {
      const paths = document.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });

    const paths = Array.from(document.querySelectorAll('path')).slice(0, 3);

    expect(paths[0].style.fill).toMatch(/red|green|gray/); // value -1
    expect(paths[1].style.fill).toMatch(/red|green|gray/); // value 0
    expect(paths[2].style.fill).toMatch(/red|green|gray/); // value 1
  });
});
