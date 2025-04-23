import { render, screen, fireEvent } from '@testing-library/react';
import SideBar from '../../components/SideBar';  // 确保正确引用 SideBar 组件
import '@testing-library/jest-dom';

describe('SideBar Component', () => {
  // Test if the logo and title are rendered
  test('renders Functions and Explanations correctly', () => {
    render(<SideBar />);
    
    // Check if the Functions and Explanations are in the document
    expect(screen.getByText(/Functions/)).toBeInTheDocument();
    expect(screen.getByText(/Explanations/i)).toBeInTheDocument();
  });

  // Test if the threshold input exists and can accept values
  test('threshold input exists and can accept values', () => {
    render(<SideBar />);
    const inputBox = screen.getByPlaceholderText(/-1/i);
    expect(inputBox).toBeInTheDocument();

    fireEvent.change(inputBox, { target: { value: '0.5' } });
    expect(inputBox.value).toBe('0.5');
  });

  // Test if the Submit Filters button exists and works
  test('Submit Filters button exists and works', () => {
    render(<SideBar />);
    const submitBtn = screen.getByText(/Submit Filters/i);
    expect(submitBtn).toBeInTheDocument();

    fireEvent.click(submitBtn);
    // You can assert that the expected behavior happens when Submit Filters is clicked, for example:
    // expect(someFunction).toHaveBeenCalled();
  });

  // Test if the dialog pops up showing missing parameters when one or more required fields are not selected
  test('shows dialog when one or more required parameters are not selected', () => {
    render(<SideBar />);

    // Simulate no selection for required fields: Definition, Drought Index, Time Frames, Source, and Scenario
    const submitButton = screen.getByText(/Submit Filters/i);

    // Initially, all fields are empty or unselected
    fireEvent.click(submitButton);

    // Check if the dialog pops up with the correct message
    expect(screen.getByText(/Please select the following fields:/i)).toBeInTheDocument();
    expect(screen.getByText(/definition/)).toBeInTheDocument();
    expect(screen.getByText(/drought index/)).toBeInTheDocument();
    expect(screen.getByText(/time frames/)).toBeInTheDocument();
    expect(screen.getByText(/source/)).toBeInTheDocument();
    expect(screen.getByText(/scenario/)).toBeInTheDocument();

  });

  // Test if the Explanation dialogs are functioning correctly
  test('opens explanation dialog for each explanation button', () => {
    render(<SideBar />);
  
    const buttonsToTest = [
      /DEFINITION/,
      /DROUGHT INDEX/,
      /TIME FRAMES/,
      /SOURCE/,
      /SCENARIO/,
      /THRESHOLD/,
      /CALCULATION METHODS/,
    ];
  
    buttonsToTest.forEach((label) => {
      const btn = screen.getByText(label);
      fireEvent.click(btn);
      expect(screen.getByText(/Explanations/)).toBeInTheDocument();
    });
  });
});
