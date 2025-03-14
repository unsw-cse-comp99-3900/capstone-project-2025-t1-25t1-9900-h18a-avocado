import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// UseGeoJSON data
const STATE_GEOJSON_URL = "https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson";

function Map() {
  const [stateGeoData, setStateGeoData] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Get the GeoJSON data for Australian states
  useEffect(() => {
    fetch(STATE_GEOJSON_URL)
      .then((response) => response.json())
      .then((data) => {
        console.log("Loaded GeoJSON:", data);
        setStateGeoData(data);
      })
      .catch((error) => console.error("Error loading state GeoJSON:", error));
  }, []);

  // Handle click event
  const onEachFeature = (feature, layer) => {
    layer.on({
      click: (e) => {
        const regionName = feature.properties.STATE_NAME || "Unknown"; // Get the state name
        setSelectedRegion(regionName);
        console.log("Clicked region:", regionName);

        // Highlight the clicked region
        layer.setStyle({
          fillColor: "yellow",
          color: "red",
          weight: 3,
          fillOpacity: 0.7,
        });

        // Reset the style of other regions
        layer.bringToFront();
      },
    });
  };

  return (
    <MapContainer center={[-25.2744, 133.7751]} zoom={4} style={{ height: "100vh", flexGrow: 1 }}>
      {/* Use OpenStreetMap as the tile layer */}
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Render state-level administrative regions */}
      {stateGeoData && (
        <GeoJSON
          data={stateGeoData}
          onEachFeature={onEachFeature}
          style={() => ({
            fillColor: "blue",
            color: "white",
            weight: 2,
            fillOpacity: 0.4,
          })}
        />
      )}
    </MapContainer>
  );
}

export default Map;
