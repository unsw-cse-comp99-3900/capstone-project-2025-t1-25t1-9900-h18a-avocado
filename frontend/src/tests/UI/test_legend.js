import React from 'react';
import { render, screen } from '@testing-library/react';
import Legend from '../../components/Legend'; // 调整路径确保对

describe('Legend Component', () => {
  test('renders title correctly', () => {
    render(<Legend />);
    expect(screen.getByText('Drought Change')).toBeInTheDocument();
  });

  test('renders all legend items correctly', () => {
    render(<Legend />);
    
    expect(screen.getByText('Positive Change')).toBeInTheDocument();
    expect(screen.getByText('Negative Change')).toBeInTheDocument();
    expect(screen.getByText('No Change')).toBeInTheDocument();
  });

  test('renders three color boxes', () => {
    render(<Legend />);
    
    // 查询所有绿色小方块，利用 role="presentation"或者直接查 div
    const colorBoxes = screen.getAllByRole('presentation');
    expect(colorBoxes.length).toBe(3);
  });
});
