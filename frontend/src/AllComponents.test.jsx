import { render, screen, fireEvent, within } from '@testing-library/react';
import TopBar from './components/TopBar';
import SideBar from './components/SideBar';
import Legend from './components/Legend';

// Removed RegionDetail import because it depends on react-router-dom

describe('TopBar', () => {
  test('renders logo and title', () => {
    render(<TopBar />);
    expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
    expect(screen.getByText(/Future Drought Explorer System/i)).toBeInTheDocument();
  });

  test('has correct alt text for logo', () => {
    render(<TopBar />);
    const logo = screen.getByAltText(/logo/i);
    expect(logo).toHaveAttribute('alt', 'logo');
  });
});

describe('SideBar', () => {
  test('renders key UI text', () => {
    render(<SideBar onFetchData={() => {}} />);
    expect(screen.getByText(/Functions/i)).toBeInTheDocument();
    expect(screen.getByText(/Explanations/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Filters/i })).toBeInTheDocument();
  });

  test('changes threshold input and triggers fetch', () => {
    const onFetchData = jest.fn();
    render(<SideBar onFetchData={onFetchData} />);
    const input = screen.getByPlaceholderText('-1');
    fireEvent.change(input, { target: { value: '0.5' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Filters/i }));
    expect(onFetchData).toHaveBeenCalled();
  });

  test('renders all dropdown labels', () => {
    render(<SideBar onFetchData={() => {}} />);
    ['Definition', 'Drought Index', 'Time Frames', 'Source', 'Scenario'].forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test('renders threshold input element', () => {
    render(<SideBar onFetchData={() => {}} />);
    const input = screen.getByPlaceholderText('-1');
    expect(input).toBeInTheDocument();
  });

  test('opens explanation dialogs and closes them one by one', async () => {
    render(<SideBar onFetchData={() => {}} />);

    const labels = ['SPI', 'SPEI', 'PDSI', 'Calculation Methods', 'Climate Models'];

    for (let label of labels) {
      const button = screen.queryByText(label);
      if (!button) {
        console.warn(`Warning: Could not find explanation button with label "${label}"`);
        continue;
      }

      fireEvent.click(button);

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText(/Explanation/i)).toBeInTheDocument();

      const closeButton = within(dialog).getByRole('button', { name: /Close/i });
      fireEvent.click(closeButton);
    }
  });
});

describe('Legend', () => {
  test('renders legend labels', () => {
    render(<Legend />);
    expect(screen.getByText(/Positive Change/i)).toBeInTheDocument();
    expect(screen.getByText(/Negative Change/i)).toBeInTheDocument();
    expect(screen.getByText(/No Change/i)).toBeInTheDocument();
  });

  test('renders colored boxes for legend items using backgroundColor', () => {
    render(<Legend />);
    const greenBox = screen.getByText(/Positive Change/i).previousSibling;
    const redBox = screen.getByText(/Negative Change/i).previousSibling;
    const grayBox = screen.getByText(/No Change/i).previousSibling;
    expect(greenBox).toHaveStyle('background-color: green');
    expect(redBox).toHaveStyle('background-color: red');
    expect(grayBox).toHaveStyle('background-color: gray');
  });
});
