import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import regionApi from "../api/regionApi";
import svgContent from "../data/svgMap";
import { getEventFreqByDecade, getMonthCountByDecade } from "../api/dataStats";

const bounds = [
  [-6, 110], // 西南角
  [-45, 150], // 东北角
];
const regionColors = {
  1: "red",
  2: "blue",
};
const generateColor = (regionId) => {
  return regionColors[regionId] || "gray"; // 如果没有预设的颜色，使用灰色
};

function Map({ mapData, filters }) {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [droughtData, setDroughtData] = useState(null);
  const [regionColors, setRegionColors] = useState({});

  useEffect(() => {
    if (mapData && Array.isArray(mapData.received_data)) {
      const colors = {};
      mapData.received_data.forEach((value, index) => {
        const regionId = index + 1;
        if (value === 0) {
          colors[regionId] = "gray";
        } else if (value > 0) {
          colors[regionId] = "green";
        } else if (value < 0) {
          colors[regionId] = "red";
        }
      });
      setRegionColors(colors);
    } else {
      console.error("Invalid mapData format:", mapData);
    }
  }, [mapData]);

  const fetchRegionStats = async (regionId) => {
    const base = {
      region_id: 1030,
      index: filters["Drought Index"]?.toLowerCase(),
      data_source: filters["Source"]?.toLowerCase(),
      scenario: filters["Scenario"]?.toLowerCase().replace(/[.\-]/g, ""),
      threshold: parseFloat(filters["Threshold"]) || -1,
    };

    const [futureStart, futureEnd] = filters["Time Frames"]
      ? filters["Time Frames"].split("-").map((v) => parseInt(v.trim()))
      : [2020, 2059];
    console.log("futureStart:", futureStart, "futureEnd:", futureEnd);

    const futurePayload = { ...base, start_year: futureStart, end_year: futureEnd };
    const baselinePayload = { ...base, start_year: 1980, end_year: 2019 };
    console.log("futurePayload:", futurePayload);
    console.log("baselinePayload:", baselinePayload);


    const [futureEvents, futureMonths, baselineEvents, baselineMonths] = await Promise.all([
      regionApi.fetchDroughtEvents(futurePayload),
      regionApi.fetchDroughtMonths(futurePayload),
      regionApi.fetchDroughtEvents(baselinePayload),
      regionApi.fetchDroughtMonths(baselinePayload),
    ]);
    console.log("futureEvents:", futureEvents);
    console.log("baselineEvents:", baselineEvents);


    return {
      futureFreq: getEventFreqByDecade(futureEvents.drought_events, futureStart, futureEnd),
      futureLen: getMonthCountByDecade(futureMonths.drought_months_details, futureStart, futureEnd),
      baselineFreq: getEventFreqByDecade(baselineEvents.drought_events, 1980, 2019),
      baselineLen: getMonthCountByDecade(baselineMonths.drought_months_details, 1980, 2019),
    };
    
    
  };

  const SVGOverlay = () => {
    const map = useMap();

    useEffect(() => {
      if (!svgContent || !bounds || !map) return;

      const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgElement.setAttribute("viewBox", "0 0 793 653");
      svgElement.innerHTML = svgContent;

      const svgOverlay = L.svgOverlay(svgElement, bounds, { interactive: true }).addTo(map);

      svgElement.querySelectorAll("path").forEach((path) => {
        const regionId = path.getAttribute("data-map-region-id");
        if (!regionId) return;
        const regionNum = parseInt(regionId, 10);
        if (regionNum === 2) return;

        const color = regionColors[regionId] || "gray";
        path.style.fill = color;
        path.dataset.originalColor = color;

        path.onclick = async (event) => {
          event.preventDefault();
          setSelectedRegion(regionId);
          const stats = await fetchRegionStats(regionId);
          console.log("filters:", filters);
          console.log("stats:", stats);

          navigate(`/region/${regionId}`, {
            state: {
              filters,
              ...stats,
            },
          });
          console.log("state:", {state: { filters, ...stats }});
        };

        path.onmouseover = (event) => {
          event.target.style.fill = "yellow";
        };
        path.onmouseout = (event) => {
          event.target.style.fill = event.target.dataset.originalColor;
        };
      });

      return () => {
        if (svgOverlay) map.removeLayer(svgOverlay);
      };
    }, [map, regionColors]);

    return null;
  };

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={[-25.2744, 133.7751]}
        zoom={5}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        touchZoom={false}
        style={{ height: "100vh", width: "100%", backgroundColor: "lightblue" }}
      >
        <SVGOverlay />
      </MapContainer>

      {selectedRegion && (
        <div className="info-box">
          <h2>Selected Region: {selectedRegion}</h2>
          {droughtData ? (
            <div>
              <p><strong>SPI:</strong> {droughtData.spi}</p>
              <p><strong>SPEI:</strong> {droughtData.spei}</p>
              <p><strong>Drought Duration:</strong> {droughtData.drought_duration} days</p>
            </div>
          ) : (
            <p>Loading drought index...</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Map;
