import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DropDown from '../../components/DropDown';
import '@testing-library/jest-dom';

describe('DropDown Component', () => {
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    mockOnSelectionChange.mockClear();
  });

  test('renders dropdown with label', () => {
    render(
      <DropDown 
        label="Definition" 
        icon={<div data-testid="icon" />} 
        onSelectionChange={mockOnSelectionChange} 
        selectedSource=""
      />
    );

    // check if the label is rendered correctly
    expect(screen.getByText('Definition')).toBeInTheDocument();
  });

  test('expands dropdown on click', async () => {
    render(
      <DropDown 
        label="Definition" 
        icon={<div data-testid="icon" />} 
        onSelectionChange={mockOnSelectionChange} 
        selectedSource=""
      />
    );

    // 1. click on the ListItem to expand the Select
    fireEvent.click(screen.getByText('Definition'));

    // 2. click on the combobox (Select)
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);

    // 3. wait for the dropdown options to appear
    const option = await screen.findByText('Change in Number');
    expect(option).toBeInTheDocument();
  });

  test('selects an option and calls onSelectionChange', async () => {
    render(
      <DropDown 
        label="Definition" 
        icon={<div data-testid="icon" />} 
        onSelectionChange={mockOnSelectionChange} 
        selectedSource=""
      />
    );

    // 1. expand the dropdown
    fireEvent.click(screen.getByText('Definition'));

    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);

    // 2. wait and click on the option
    const option = await screen.findByText('Change in Number');
    fireEvent.click(option);

    // 3. check if the onSelectionChange function was called with the correct arguments
    expect(mockOnSelectionChange).toHaveBeenCalledWith('Definition', 'Change in Number');
  });

  test('renders scenario options based on selectedSource1', async () => {
    render(
      <DropDown 
        label="Scenario" 
        icon={<div data-testid="icon" />} 
        onSelectionChange={mockOnSelectionChange} 
        selectedSource="CMIP5"
      />
    );

    // expand the scenario dropdown
    fireEvent.click(screen.getByText('Scenario'));
    fireEvent.mouseDown(screen.getByRole('combobox'));

    // check the options for CMIP5
    expect(await screen.findByText('RCP4.5')).toBeInTheDocument();
    expect(screen.getByText('RCP8.5')).toBeInTheDocument();
  });
  test('renders scenario options based on selectedSource2', async () => {
    // switch source to CMIP6
    render(
      <DropDown 
        label="Scenario" 
        icon={<div data-testid="icon" />} 
        onSelectionChange={mockOnSelectionChange} 
        selectedSource="CMIP6"
      />
    );

    // expand the scenario dropdown again
    fireEvent.click(screen.getByText('Scenario'));
    fireEvent.mouseDown(screen.getByRole('combobox'));

    // check the options for CMIP6
    expect(await screen.findByText('SSP1-2.6')).toBeInTheDocument();
    expect(screen.getByText('SSP3-7.0')).toBeInTheDocument();
  });
});
