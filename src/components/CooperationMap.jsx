import React, { useMemo, useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';

import { scaleQuantile } from 'd3-scale';
import { geoCentroid } from 'd3-geo';
import { Tooltip } from 'react-tooltip';
import './react-tooltip.css';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Database, FileText, Activity } from 'lucide-react';
import clsx from 'clsx';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

const SPECIAL_REGIONS = [
    { name: "Singapore", coordinates: [103.8198, 1.3521] },
    { name: "Hong Kong", coordinates: [114.1694, 22.3193] },
    { name: "Macao", coordinates: [113.5439, 22.1987] }
];

const CooperationMap = () => {
    const [data, setData] = useState([]);
    const [metric, setMetric] = useState('papers');
    const [position, setPosition] = useState({ coordinates: [15, 35], zoom: 1 });
    const [activeRegion, setActiveRegion] = useState(null);

    const normalizeCountryName = (name) => {
        if (!name) return "";
        const lower = name.toLowerCase().trim();

        const mapping = {
            "china mainland": "China",
            "china": "China",
            "peoples r china": "China",
            "usa": "United States of America",
            "united states": "United States of America",
            "us": "United States of America",
            "united states of america": "United States of America",
            "the united states": "United States of America",
            "uk": "United Kingdom",
            "united kingdom": "United Kingdom",
            "great britain": "United Kingdom",
            "england": "United Kingdom",
            "scotland": "United Kingdom",
            "wales": "United Kingdom",
            "northern ireland": "United Kingdom",
            "hong kong": "Hong Kong",
            "hong kong sar": "Hong Kong",
            "macau": "Macao",
            "macao": "Macao",
            "taiwan": "Taiwan",
            "taiwan, province of china": "Taiwan",
            "russian federation": "Russia",
            "russia": "Russia",
            "south korea": "South Korea",
            "korea": "South Korea",
            "korea, rep.": "South Korea",
            "republic of korea": "South Korea",
            "vietnam": "Vietnam",
            "viet nam": "Vietnam",
            "turkiye": "Turkey",
            "turkey": "Turkey",
            "czech republic": "Czech Republic",
            "czechia": "Czech Republic",
            "iran": "Iran",
            "iran, islamic republic of": "Iran",
            "laos": "Laos",
            "lao people's democratic republic": "Laos",
            "syria": "Syria",
            "syrian arab republic": "Syria"
        };

        if (mapping[lower]) return mapping[lower];

        return name.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };

    useEffect(() => {
        fetch('/data/cooperation_stats.json')
            .then(res => res.json())
            .then(rawData => {
                const aggregatedMap = {};

                rawData.forEach(item => {
                    const stdName = normalizeCountryName(item.name);

                    if (!aggregatedMap[stdName]) {
                        aggregatedMap[stdName] = {
                            name: stdName,
                            papers: item.papers,
                            citations: item.citations,
                            weightedCnciSum: item.cnci * item.papers,
                            totalPapersForCnci: item.papers
                        };
                    } else {
                        aggregatedMap[stdName].papers += item.papers;
                        aggregatedMap[stdName].citations += item.citations;
                        aggregatedMap[stdName].weightedCnciSum += (item.cnci * item.papers);
                        aggregatedMap[stdName].totalPapersForCnci += item.papers;
                    }
                });

                const aggregatedData = Object.values(aggregatedMap).map(d => ({
                    name: d.name,
                    papers: d.papers,
                    citations: d.citations,
                    cnci: d.totalPapersForCnci > 0
                        ? parseFloat((d.weightedCnciSum / d.totalPapersForCnci).toFixed(2))
                        : 0
                }));

                setData(aggregatedData);
            })
            .catch(err => console.error("Failed to load cooperation data:", err));
    }, []);

    const processedData = useMemo(() => {
        const sorted = [...data].sort((a, b) => b[metric] - a[metric]);
        return sorted.map((item, index) => ({
            ...item,
            rank: index + 1
        }));
    }, [data, metric]);

    const colorScale = useMemo(() => {
        const values = data.map(d => d[metric]);
        return scaleQuantile()
            .domain(values)
            .range(
                metric === 'papers'
                    ? ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']
                    : ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c']
            );
    }, [data, metric]);

    const getCountryColor = (d) => {
        if (!d) return "#F5F4F6";

        if (d.rank === 1) {
            return metric === 'papers' ? '#172554' : '#451a03';
        }
        if (d.rank === 2) {
            return metric === 'papers' ? '#1e40af' : '#9a3412';
        }
        if (d.rank === 3) {
            return metric === 'papers' ? '#3b82f6' : '#ea580c';
        }

        if (d.rank <= 10) {
            return metric === 'papers' ? '#93c5fd' : '#fdba74';
        }
        return colorScale(d[metric]);
    };

    const dataMap = useMemo(() => {
        const map = {};
        processedData.forEach(d => {
            const standardName = normalizeCountryName(d.name);
            map[standardName] = d;
            map[d.name] = d;
        });
        return map;
    }, [processedData]);

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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: '480px' }}>
            <div className="flex h-full">
                {/* Left Sidebar: Scrollable Country List (25% width) */}
                <div className="w-[25%] border-r border-slate-100 flex flex-col">
                    <div className="p-6 border-b border-slate-100 shrink-0">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Database size={18} className="text-blue-500" />
                                主要合作国家/地区
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Top Partner Countries/Regions
                            </p>
                        </div>

                        <div className="flex bg-slate-100 p-1 rounded-lg">
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
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 custom-scrollbar">
                        {processedData.map((item) => (
                            <div
                                key={item.name}
                                className={clsx(
                                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                                    activeRegion === item.name
                                        ? (metric === 'papers' ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-orange-50 border-orange-200 shadow-sm")
                                        : "border-slate-100 hover:bg-slate-50"
                                )}
                                onMouseEnter={() => setActiveRegion(item.name)}
                                onMouseLeave={() => setActiveRegion(null)}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={clsx(
                                        "w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-colors shrink-0",
                                        item.rank === 1 ? (metric === 'papers' ? "bg-[#172554] text-white" : "bg-[#451a03] text-white") :
                                            item.rank === 2 ? (metric === 'papers' ? "bg-[#1e40af] text-white" : "bg-[#9a3412] text-white") :
                                                item.rank === 3 ? (metric === 'papers' ? "bg-[#3b82f6] text-white" : "bg-[#ea580c] text-white") :
                                                    (item.rank <= 10 ? (metric === 'papers' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700") : "bg-slate-100 text-slate-500")
                                    )}>
                                        {item.rank}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-bold text-slate-700 truncate" title={item.name}>{item.name}</div>
                                        <div className="text-xs text-slate-400">CNCI: {item.cnci}</div>
                                    </div>
                                </div>
                                <div className={clsx(
                                    "text-sm font-bold ml-2 shrink-0",
                                    metric === 'papers' ? "text-blue-600" : "text-orange-600"
                                )}>
                                    {item[metric].toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Map (75% width) */}
                <div className="w-[75%] bg-slate-50 relative">
                    {/* Zoom Controls */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                        <button
                            onClick={handleZoomIn}
                            className="p-2 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800"
                        >
                            <ZoomIn size={18} />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="p-2 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800"
                        >
                            <ZoomOut size={18} />
                        </button>
                    </div>

                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{
                            scale: 140,
                            center: [15, 35]
                        }}
                        width={800}
                        height={480}
                        style={{ width: "100%", height: "100%" }}
                    >
                        <ZoomableGroup
                            zoom={position.zoom}
                            center={position.coordinates}
                            onMoveEnd={handleMoveEnd}
                            maxZoom={4}
                            minZoom={1}
                            translateExtent={[[0, 0], [800, 480]]}
                        >
                            <Geographies geography={GEO_URL}>
                                {({ geographies }) => {
                                    const mapPaths = geographies.map((geo) => {
                                        const countryName = geo.properties.name;
                                        const standardGeoName = normalizeCountryName(countryName);
                                        const d = dataMap[standardGeoName] || dataMap[countryName];
                                        const isActive = activeRegion && normalizeCountryName(activeRegion) === standardGeoName;

                                        return (
                                            <React.Fragment key={geo.rsmKey}>
                                                <Geography
                                                    geography={geo}
                                                    fill={isActive ? "#06b6d4" : getCountryColor(d)}
                                                    stroke={isActive ? "#0891b2" : "#D6D6DA"}
                                                    strokeWidth={isActive ? 2 : 0.5}
                                                    style={{
                                                        default: { outline: "none", transition: "all 0.3s" },
                                                        hover: {
                                                            fill: "#06b6d4",
                                                            stroke: "#0891b2",
                                                            strokeWidth: 2,
                                                            outline: "none",
                                                            cursor: d ? "pointer" : "default"
                                                        },
                                                        pressed: { outline: "none" }
                                                    }}
                                                    data-tooltip-id="geo-tooltip"
                                                    data-tooltip-content={d ? `${d.name} (#${d.rank}) | ${metric === 'papers' ? 'Papers' : 'Citations'}: ${d[metric]}` : countryName}
                                                />
                                            </React.Fragment>
                                        );
                                    });

                                    const activeGeo = activeRegion ? geographies.find(geo => normalizeCountryName(geo.properties.name) === normalizeCountryName(activeRegion)) : null;
                                    const activeCentroid = activeGeo ? geoCentroid(activeGeo) : null;
                                    const activeD = activeRegion ? dataMap[normalizeCountryName(activeRegion)] : null;

                                    return (
                                        <>
                                            {mapPaths}
                                            {activeGeo && activeD && activeCentroid && (
                                                <Marker coordinates={activeCentroid}>
                                                    <foreignObject x={20} y={-50} width={180} height={90}>
                                                        <div className="bg-slate-900/60 backdrop-blur-sm text-white p-3 rounded-lg shadow-xl border border-white/10 pointer-events-none">
                                                            <div className="text-xs font-bold mb-1 flex items-center justify-between">
                                                                <span className="truncate max-w-[100px]" title={activeD.name}>{activeD.name}</span>
                                                                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-2">#{activeD.rank}</span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-200 space-y-0.5">
                                                                <div className="flex justify-between">
                                                                    <span>{metric === 'papers' ? 'Papers' : 'Citations'}:</span>
                                                                    <span className="font-mono font-bold text-white">{activeD[metric].toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>CNCI:</span>
                                                                    <span className="font-mono font-bold text-white">{activeD.cnci}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </foreignObject>
                                                </Marker>
                                            )}
                                        </>
                                    );
                                }}
                            </Geographies>

                            {SPECIAL_REGIONS.map(({ name, coordinates }) => {
                                const d = dataMap[name];
                                const isActive = activeRegion && normalizeCountryName(activeRegion) === name;
                                return (
                                    <Marker key={name} coordinates={coordinates}>
                                        <circle
                                            r={isActive ? 5 : 3}
                                            fill={isActive ? "#06b6d4" : (d ? getCountryColor(d) : "#F5F4F6")}
                                            stroke={isActive ? "#fff" : "#fff"}
                                            strokeWidth={1.5}
                                            style={{
                                                default: { outline: "none", transition: "all 0.3s" },
                                                hover: { cursor: "pointer", outline: "none" },
                                                pressed: { outline: "none" }
                                            }}
                                            data-tooltip-id="geo-tooltip"
                                            data-tooltip-content={d ? `${d.name} (#${d.rank}) | ${metric === 'papers' ? 'Papers' : 'Citations'}: ${d[metric]}` : name}
                                        />
                                        {isActive && d && (
                                            <foreignObject x={12} y={-45} width={180} height={90}>
                                                <div className="bg-slate-900/60 backdrop-blur-sm text-white p-3 rounded-lg shadow-xl border border-white/10 pointer-events-none">
                                                    <div className="text-xs font-bold mb-1 flex items-center justify-between">
                                                        <span className="truncate max-w-[100px]" title={d.name}>{d.name}</span>
                                                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-2">#{d.rank}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-200 space-y-0.5">
                                                        <div className="flex justify-between">
                                                            <span>{metric === 'papers' ? 'Papers' : 'Citations'}:</span>
                                                            <span className="font-mono font-bold text-white">{d[metric].toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>CNCI:</span>
                                                            <span className="font-mono font-bold text-white">{d.cnci}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </foreignObject>
                                        )}
                                    </Marker>
                                );
                            })}
                        </ZoomableGroup>
                    </ComposableMap>
                    <Tooltip id="geo-tooltip" style={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px", fontSize: "12px", zIndex: 100 }} />

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-md">
                        <div className="text-xs font-bold text-slate-600 mb-2">
                            {metric === 'papers' ? '发文量分布' : '被引频次分布'}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <div className={clsx("w-3 h-3 rounded-full", metric === 'papers' ? "bg-[#172554]" : "bg-[#451a03]")}></div>
                                <span className="text-[10px] text-slate-600">No.1</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={clsx("w-3 h-3 rounded-full", metric === 'papers' ? "bg-[#1e40af]" : "bg-[#9a3412]")}></div>
                                <span className="text-[10px] text-slate-600">No.2</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={clsx("w-3 h-3 rounded-full", metric === 'papers' ? "bg-[#3b82f6]" : "bg-[#ea580c]")}></div>
                                <span className="text-[10px] text-slate-600">No.3</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={clsx("w-3 h-3 rounded-full", metric === 'papers' ? "bg-[#93c5fd]" : "bg-[#fdba74]")}></div>
                                <span className="text-[10px] text-slate-600">Top 4-10</span>
                            </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200">
                            <div className="flex gap-1">
                                {(metric === 'papers'
                                    ? ['#eff6ff', '#dbeafe', '#bfdbfe', '#60a5fa']
                                    : ['#fff7ed', '#ffedd5', '#fed7aa', '#fb923c']
                                ).map(color => (
                                    <div key={color} className="w-4 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
                                ))}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">Others (gradient)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CooperationMap;
