import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TopBar from '../../components/TopBar';
import '@testing-library/jest-dom';

describe('TopBar Component', () => {
  // Test if the logo and title are rendered
  test('renders logo and title correctly', () => {
    render(<TopBar />);
    
    // Check if the title is in the document
    expect(screen.getByText(/Future Drought Explorer System \(baseline: 1976-2005\)/i)).toBeInTheDocument();
    
    // Check if the logo is displayed
    const logo = screen.getByAltText(/logo/i);
    expect(logo).toBeInTheDocument();
  });

  // Test if the "How to use it?" button is present and functions correctly
  test('renders "How to use it?" button and opens dialog', () => {
    render(<TopBar />);
    
    // Check if the button exists
    const button = screen.getByText(/How to use it\?/i);
    expect(button).toBeInTheDocument();

    // Simulate button click
    fireEvent.click(button);

    // Check if the dialog is opened
    expect(screen.getByText(/How to Use the Future Drought Explorer/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1: Select the drought definition/i)).toBeInTheDocument();
  });

  // Test dialog close functionality
  test('closes dialog when close button is clicked', async () => {
    render(<TopBar />);
    
    // Open dialog by clicking the button
    const button = screen.getByText(/How to use it\?/i);
    fireEvent.click(button);

    // Ensure dialog is open
    expect(screen.getByText(/How to Use the Future Drought Explorer/i)).toBeInTheDocument();
    
    // Close dialog by clicking the close button in the dialog
    const closeButton = screen.getByText(/Close/i);
    fireEvent.click(closeButton);
    
    // Wait for dialog to be removed from the document
    await waitFor(() => {
      expect(screen.queryByText(/How to Use the Future Drought Explorer/i)).not.toBeInTheDocument();
    });
  });

  // Test if the steps in the dialog are rendered
  test('renders steps correctly in the dialog', () => {
    render(<TopBar />);
    
    // Open dialog by clicking the "How to use it?" button
    const button = screen.getByText(/How to use it\?/i);
    fireEvent.click(button);

    // Verify all steps are rendered
    const steps = [
      /Step 1: Select the drought definition/i,
      /Step 2: Choose the drought index/i,
      /Step 3: Choose the time range/i,
      /Step 4: Select the data source/i,
      /Step 5: Based on the selected source, choose a scenario/i,
      /Step 6: Input a threshold/i,
      /Step 7: Click 'Submit Filters' to visualize the drought change on the map/i,
      /Step 8: Click a region on the map to view detailed drought statistics/i,
      /Step 9: Explore the detail page to compare drought metrics across different models/i
    ];

    steps.forEach(step => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });
});
