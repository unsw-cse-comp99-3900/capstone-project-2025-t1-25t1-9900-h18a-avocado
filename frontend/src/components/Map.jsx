import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import regionApi from "../api/regionApi";
import svgContent from "../data/svgMap";

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

function Map({ mapData }) {

  const navigate = useNavigate();

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [droughtData, setDroughtData] = useState(null);
  const [regionColors, setRegionColors] = useState({});

  useEffect(() => {
    // 确保 mapData 是一个对象，并且包含 received_data 字段
    if (mapData && Array.isArray(mapData.received_data)) {
      const colors = {};
      mapData.received_data.forEach((value, index) => {
        const regionId = index + 1; // 假设 regionId 从 1 开始
        if (value === 0) {
          colors[regionId] = "gray"; // 不变
        } else if (value === 1) {
          colors[regionId] = "green"; // 增加
        } else if (value === 2) {
          colors[regionId] = "red"; // 减少
        }
      });
      setRegionColors(colors);
    } else {
      console.error("Invalid mapData format:", mapData);
    }
  }, [mapData]);

  const fetchDroughtData = async (regionId) => {
    if (!regionId || parseInt(regionId, 10) === 2) return; // 跳过 regionId=2
  
    console.log(`Fetching drought index for region ${regionId}...`);
    setDroughtData(null);
  
    // const requestData = {
    //   time: new Date().toISOString().split("T")[0],
    //   latitude: -27.5,  // 这里可以根据 regionId 修改经纬度
    //   longitude: 133.0,
    // };
    console.log("Sending regionId to API:", regionId);
    try {
      const data = await regionApi.fetchDroughtData(regionId); // ✅ 直接调用 regionApi
      console.log("API Response:", data);
  
      if (data.success) {
        setDroughtData(data);
      } else {
        console.error("Failed to fetch drought index:", data.msg);
        setDroughtData(null);
      }
    } catch (error) {
      console.error("Request error:", error);
      setDroughtData(null);
    }
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
  
        // 确保 regionId 存在，并转换为数字
        if (!regionId) return;
        const regionNum = parseInt(regionId, 10);
        
        // 跳过 regionId = 2
        if (regionNum === 2) return;
  
        const color = regionColors[regionId] || "gray";
        path.style.fill = color;
        path.dataset.originalColor = color;
  
        // 鼠标左键点击时，向后端请求数据
        path.onclick = async (event) => {
          event.preventDefault();
          
          console.log("Clicked region ID:", regionId);
          navigate(`/region/${regionId}`);

          const clickedRegionId = event.target.getAttribute("data-map-region-id");
          setSelectedRegion(clickedRegionId);
  
          console.log("Fetching data for region ID:", clickedRegionId);
  
          await fetchDroughtData(clickedRegionId);
        };
  
        // 悬浮时变色
        path.onmouseover = (event) => {
          event.target.style.fill = "yellow";
        };
  
        // 鼠标移出时恢复原始颜色
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
        zoomControl={false} // ✅ 禁用缩放控件
        dragging={false} // ✅ 禁用拖拽
        scrollWheelZoom={false} // ✅ 禁用鼠标滚轮缩放
        doubleClickZoom={false} // ✅ 禁用双击缩放
        boxZoom={false} // ✅ 禁用框选缩放
        keyboard={false} // ✅ 禁用键盘缩放
        touchZoom={false} // ✅ 禁用触摸缩放
        style={{ height: "100vh", width: "100%", backgroundColor: "lightblue" }} // ✅ 让地图铺满右侧
      >
        {/* 删除或注释掉 TileLayer */}
        {/* <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /> */}
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