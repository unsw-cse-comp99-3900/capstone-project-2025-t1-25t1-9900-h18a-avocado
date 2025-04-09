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
      threshold: parseFloat(filters["Threshold"]) || -1,
    };
  
    const [futureStart, futureEnd] = filters["Time Frames"]
      ? filters["Time Frames"].split("-").map((v) => parseInt(v.trim()))
      : [2020, 2059];
  
    // 未来数据请求：根据 Source 请求不同的 scenario 数据
    const scenarios = filters["Source"] === "CMIP5" 
      ? ["rcp45", "rcp85"] 
      : ["ssp126", "ssp370"];
  
    const futurePayloads = scenarios.map((scenario) => ({
      ...base,
      start_year: futureStart,
      end_year: futureEnd,
      scenario: scenario,
    }));
  
    const baselineScenario = filters["Source"] === "CMIP5" ? "rcp45" : "ssp126"; // Default to first scenario
    const baselinePayload = { 
      ...base,
      start_year: 1976,
      end_year: 2005,
      scenario: baselineScenario, // Adding scenario to baseline request
    };
  
    console.log("baselinePayload:", baselinePayload);
    console.log("futurePayloads:", futurePayloads);
  
    const [futureData1, futureData2, baselineData] = await Promise.all([
      regionApi.fetchDroughtEvents(futurePayloads[0]),
      regionApi.fetchDroughtEvents(futurePayloads[1]),
      regionApi.fetchDroughtEvents(baselinePayload),
    ]);
  
    const [futureMonths1, futureMonths2, baselineMonths] = await Promise.all([
      regionApi.fetchDroughtMonths(futurePayloads[0]),
      regionApi.fetchDroughtMonths(futurePayloads[1]),
      regionApi.fetchDroughtMonths(baselinePayload),
    ]);
  
    // 返回修改后的数据结构
    return {
      futureData: {
        [scenarios[0]]: {
          freq: getEventFreqByDecade(futureData1.drought_events, futureStart, futureEnd),
          len: getMonthCountByDecade(futureMonths1.drought_months_details, futureStart, futureEnd),
        },
        [scenarios[1]]: {
          freq: getEventFreqByDecade(futureData2.drought_events, futureStart, futureEnd),
          len: getMonthCountByDecade(futureMonths2.drought_months_details, futureStart, futureEnd),
        },
      },
      baselineFreq: getEventFreqByDecade(baselineData.drought_events, 1976, 2005),
      baselineLen: getMonthCountByDecade(baselineMonths.drought_months_details, 1976, 2005),
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
          const stats = await fetchRegionStats(regionId); // 获取未来和基准数据
          
          console.log("filters:", filters);
          console.log("stats:", stats);
        
          // 传递修改后的结构
          const { Scenario, ...filteredFilters } = filters; // 移除不需要的字段

          navigate(`/region/${regionId}`, {
            state: {
              filters: filteredFilters, // 将去掉 Definition 和 Scenario 的 filters 传递给 state
              futureData: stats.futureData, // 传递两个 scenario 的数据
              baselineFreq: stats.baselineFreq,
              baselineLen: stats.baselineLen,
            },
          });

          console.log("state:", { state: { filters, ...stats } });
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
