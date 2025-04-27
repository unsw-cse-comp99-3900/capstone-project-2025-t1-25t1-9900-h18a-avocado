import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DropDown from '../../components/DropDown';
import '@testing-library/jest-dom'; // 确保引入

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

    // 检查 label 是否渲染
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

    // 1. 先点击 "Definition" ListItem，展开 Select
    fireEvent.click(screen.getByText('Definition'));

    // 2. 点击 combobox (Select)
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);

    // 3. 异步等待下拉选项出现
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

    // 1. 展开
    fireEvent.click(screen.getByText('Definition'));

    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);

    // 2. 等待并点击选项
    const option = await screen.findByText('Change in Number');
    fireEvent.click(option);

    // 3. 确认 onSelectionChange 被正确触发
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

    // 展开 Scenario
    fireEvent.click(screen.getByText('Scenario'));
    fireEvent.mouseDown(screen.getByRole('combobox'));

    // 检查 CMIP5 相关选项
    expect(await screen.findByText('RCP4.5')).toBeInTheDocument();
    expect(screen.getByText('RCP8.5')).toBeInTheDocument();
  });
  test('renders scenario options based on selectedSource2', async () => {
    // 切换 source 到 CMIP6
    render(
      <DropDown 
        label="Scenario" 
        icon={<div data-testid="icon" />} 
        onSelectionChange={mockOnSelectionChange} 
        selectedSource="CMIP6"
      />
    );

    // 再次展开
    fireEvent.click(screen.getByText('Scenario'));
    fireEvent.mouseDown(screen.getByRole('combobox'));

    // 检查 CMIP6 相关选项
    expect(await screen.findByText('SSP1-2.6')).toBeInTheDocument();
    expect(screen.getByText('SSP3-7.0')).toBeInTheDocument();
  });
});
