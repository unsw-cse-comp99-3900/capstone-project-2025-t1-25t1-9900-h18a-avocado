import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import RegionDetail from '../../components/RegionDetail';
import '@testing-library/jest-dom';

describe('RegionDetail Component', () => {
  const mockState = {
    filters: {
      Definition: 'Change in Number',
      Drought_Index: 'SPI',
      Source: 'CMIP5',
      Time_Frames: '2006-2035',
    },
    stats: {
      region_id: 1010,
      region_name: 'Sample Region',
      baselineData: {
        rcp45: {
          model1: { drought_events: [{}, {}] },
          model2: { drought_events: [{}] },
        },
      },
      futureData: {
        rcp45: {
          model1: { drought_events: [{}, {}, {}] },
          model2: { drought_events: [{}, {}, {}] },
        },
      },
    },
  };

  const renderWithRouter = (state) => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/region/1010', state }]}>
        <Routes>
          <Route path="/region/:regionId" element={<RegionDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test('renders region title and details', () => {
    renderWithRouter(mockState);

    // title shows region name
    expect(screen.getByText(/Drought Analysis - Sample Region/i)).toBeInTheDocument();

    // other basic information
    expect(screen.getByText(/Index:/i)).toBeInTheDocument();
    expect(screen.getByText(/Source:/i)).toBeInTheDocument();
    expect(screen.getByText(/Baseline Period:/i)).toBeInTheDocument();
    expect(screen.getByText(/Projection Period:/i)).toBeInTheDocument();
  });

  test('renders chart titles', () => {
    renderWithRouter(mockState);

    // figure title
    expect(screen.getByText(/Projected change in number of events \(%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Projected change in number of events \(Difference\)/i)).toBeInTheDocument();
  });

  test('renders fallback message if no state', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/region/1010' }]}>
        <Routes>
          <Route path="/region/:regionId" element={<RegionDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/No region data available/i)).toBeInTheDocument();
  });
});
