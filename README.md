## Frontend Updates

### 1. Added `data/` Folder
- Created a new `data/` directory to organize shared/static data.
- Moved all region `id` and `name` mappings into `region.js`.
- Moved the SVG map content into `svgMap.js` to simplify the `Map` component.

### 2. Updated `SideBar.jsx`
- Added a `Threshold` input field to allow user customization.
- Modified the data structure sent to the backend to match the expected format.

### 3. Added `dataProcessor.js`
- Introduced a new module to handle data processing.
- Fetches both baseline data (1980–2019) and selected future data for all 58 regions defined in `region.js`.
- Calculates the difference per region and returns a list of differences for map rendering.

### 4. Updated `mapApi.js`
- Adjusted request logic and endpoint formatting to align with the backend API requirements.

### 5. File Extension Conventions
- Utility, API, and logic files now use the `.js` extension.
- React components continue to use the `.jsx` extension for clarity and consistency.