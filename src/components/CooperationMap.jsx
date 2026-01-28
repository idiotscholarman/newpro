import React, { useMemo, useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Database, FileText, Activity } from 'lucide-react';
import clsx from 'clsx';

// World Map TopoJSON (Standard 110m resolution)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CooperationMap = () => {
    const [data, setData] = useState([]);
    const [metric, setMetric] = useState('papers'); // 'papers' or 'citations'
    const [tooltipContent, setTooltipContent] = useState('');
    const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1 });

    useEffect(() => {
        fetch('/data/cooperation_stats.json')
            .then(res => res.json())
            .then(data => setData(data))
            .catch(err => console.error("Failed to load cooperation data:", err));
    }, []);

    const colorScale = useMemo(() => {
        const values = data.map(d => d[metric]);
        return scaleQuantile()
            .domain(values)
            // Color ranges: Blue for Papers, Amber/Orange for Citations
            .range(
                metric === 'papers'
                    ? ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']
                    : ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c']
            );
    }, [data, metric]);

    const dataMap = useMemo(() => {
        const map = {};
        data.forEach(d => {
            map[d.name] = d;
        });
        return map;
    }, [data]);

    const handleZoomIn = () => {
        if (position.zoom >= 4) return;
        setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.2 }));
    };

    const handleZoomOut = () => {
        if (position.zoom <= 1) return;
        setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.2 }));
    };

    const handleMoveEnd = (position) => {
        setPosition(position);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row gap-6 h-[400px]">
                {/* Left: Stats List */}
                <div className="lg:w-1/4 flex flex-col h-full">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Database size={18} className="text-blue-500" />
                            主要合作国家/地区
                        </h3>
                        <p className="text-xs text-slate-500">Top Partners by {metric === 'papers' ? 'Output' : 'Citation'}</p>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                        <button
                            onClick={() => setMetric('papers')}
                            className={clsx(
                                "flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-all",
                                metric === 'papers' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <FileText size={14} /> 发文量
                        </button>
                        <button
                            onClick={() => setMetric('citations')}
                            className={clsx(
                                "flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-all",
                                metric === 'citations' ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Activity size={14} /> 被引频次
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {data.sort((a, b) => b[metric] - a[metric]).map((item, idx) => (
                            <div key={item.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                                        idx < 3 ? (metric === 'papers' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700") : "bg-slate-100 text-slate-500"
                                    )}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-700">{item.name}</div>
                                        <div className="text-xs text-slate-400">CNCI: {item.cnci}</div>
                                    </div>
                                </div>
                                <div className={clsx(
                                    "text-sm font-bold",
                                    metric === 'papers' ? "text-blue-600" : "text-orange-600"
                                )}>
                                    {item[metric].toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Map */}
                <div className="lg:w-3/4 bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden flex flex-col">
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                        <button onClick={handleZoomIn} className="p-2 bg-white rounded-lg shadow border border-slate-200 hover:bg-slate-50 text-slate-600"><ZoomIn size={18} /></button>
                        <button onClick={handleZoomOut} className="p-2 bg-white rounded-lg shadow border border-slate-200 hover:bg-slate-50 text-slate-600"><ZoomOut size={18} /></button>
                    </div>

                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{ scale: 100 }}
                        width={800}
                        height={400} // Logical SVG height
                        style={{ width: "100%", height: "auto", maxHeight: "100%" }} // Responsive CSS
                    >
                        <ZoomableGroup
                            zoom={position.zoom}
                            center={position.coordinates}
                            onMoveEnd={handleMoveEnd}
                            maxZoom={4} // Limit zoom
                            minZoom={1}
                            translateExtent={[[0, 0], [800, 400]]} // Prevent panning out too much
                        >
                            <Geographies geography={GEO_URL}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const countryName = geo.properties.name;
                                        // Standardize names if map data differs from our list (e.g. USA vs United States is usually handled, but check)
                                        // Our data uses "United States", "China".

                                        const d = dataMap[countryName] || dataMap[geo.properties.name_long];

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={d ? colorScale(d[metric]) : "#F5F4F6"}
                                                stroke="#D6D6DA"
                                                strokeWidth={0.5}
                                                style={{
                                                    default: { outline: "none" },
                                                    hover: { fill: d ? (metric === 'papers' ? "#1e3a8a" : "#c2410c") : "#EAEAEC", outline: "none", cursor: d ? "pointer" : "default" },
                                                    pressed: { outline: "none" }
                                                }}
                                                data-tooltip-id="geo-tooltip"
                                                data-tooltip-content={d ? `${countryName} | ${metric === 'papers' ? 'Papers' : 'Citations'}: ${d[metric]}` : countryName}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                        </ZoomableGroup>
                    </ComposableMap>
                    <Tooltip id="geo-tooltip" style={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px", fontSize: "12px", zIndex: 100 }} />

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="text-xs font-bold text-slate-500 mb-2">{metric === 'papers' ? '发文量分布' : '被引频次分布'}</div>
                        <div className="flex gap-1">
                            {colorScale.range().map(color => (
                                <div key={color} className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }}></div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>Low</span>
                            <span>High</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CooperationMap;
