import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Filter } from 'lucide-react';
import clsx from 'clsx';

// Color mapping for countries (Top 15 + Others)
const COUNTRY_COLORS = {
    'CHINA MAINLAND': '#3b82f6',
    'USA': '#ef4444',
    'ENGLAND': '#8b5cf6',
    'AUSTRALIA': '#f59e0b',
    'CANADA': '#ec4899',
    'GERMANY': '#10b981',
    'JAPAN': '#14b8a6',
    'SINGAPORE': '#f97316',
    'SOUTH KOREA': '#06b6d4',
    'FRANCE': '#a855f7',
    'ITALY': '#84cc16',
    'SPAIN': '#eab308',
    'NETHERLANDS': '#6366f1',
    'SWITZERLAND': '#rgb(244, 63, 94)',
    'INDIA': '#22c55e'
};

const CollaborationBubbleChart = ({ data, metric = 'papers', onInstitutionClick }) => {
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [hoveredInstitution, setHoveredInstitution] = useState(null);

    // Process data for bubble chart
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Sort by the current metric and take top 250 to keep the chart performant and readable
        const sortedData = [...data]
            .sort((a, b) => b[metric] - a[metric])
            .slice(0, 250);

        return sortedData.map(inst => ({
            name: inst.name,
            x: inst.papers,
            y: inst.citations,
            z: inst.cnci * 100, // Scale CNCI for bubble size
            cnci: inst.cnci,
            country: inst.country || 'UNKNOWN',
            fill: COUNTRY_COLORS[inst.country] || '#94a3b8'
        }));
    }, [data, metric]);

    // Get unique countries for filter
    const countries = useMemo(() => {
        const countrySet = new Set(chartData.map(d => d.country));
        return Array.from(countrySet).sort();
    }, [chartData]);

    // Filter data based on selected countries
    const filteredData = useMemo(() => {
        if (selectedCountries.length === 0) return chartData;
        return chartData.filter(d => selectedCountries.includes(d.country));
    }, [chartData, selectedCountries]);

    const toggleCountry = (country) => {
        setSelectedCountries(prev =>
            prev.includes(country)
                ? prev.filter(c => c !== country)
                : [...prev, country]
        );
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload[0]) return null;
        const data = payload[0].payload;

        return (
            <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3 rounded-lg shadow-xl border border-white/10">
                <div className="font-bold text-sm mb-1 max-w-[200px] truncate" title={data.name}>
                    {data.name}
                </div>
                <div className="text-xs text-slate-400 mb-2 font-medium">{data.country}</div>
                <div className="space-y-1.5 border-t border-white/10 pt-2">
                    <div className="flex justify-between gap-4 text-xs">
                        <span className="text-slate-400">合作论文数 (Papers):</span>
                        <span className="font-mono font-bold text-blue-400">{data.x.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-xs">
                        <span className="text-slate-400">总被引频次 (Citations):</span>
                        <span className="font-mono font-bold text-orange-400">{data.y.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-xs">
                        <span className="text-slate-400">影响力 (CNCI):</span>
                        <span className="font-mono font-bold text-green-400">{data.cnci.toFixed(2)}</span>
                    </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 italic border-t border-white/5 pt-1">
                    CNCI &gt; 1.0 表示高于全球平均水平
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500" />
                        合作机构学术影响力分析
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Papers × Citations × CNCI (Bubble Size) by Country
                    </p>
                </div>

                {/* Country Filter Toggle */}
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-500">
                        {selectedCountries.length > 0 ? `${selectedCountries.length} selected` : 'All Countries'}
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Papers"
                            scale="log"
                            domain={[1, 'auto']}
                            label={{ value: '合作发文量 (Log Scale)', position: 'insideBottom', offset: -25, style: { fontSize: 11, fill: '#64748b' } }}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            base={10}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Citations"
                            scale="log"
                            domain={[1, 'auto']}
                            label={{ value: '被引频次 (Log Scale)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#64748b' } }}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            base={10}
                        />
                        <ZAxis
                            type="number"
                            dataKey="z"
                            range={[40, 500]}
                            name="CNCI"
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                        {/* Quadrant Labels */}
                        <text x="85%" y="15%" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" className="pointer-events-none">
                            战略合作伙伴
                        </text>
                        <text x="15%" y="15%" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" className="pointer-events-none">
                            高潜力/新兴
                        </text>
                        <text x="85%" y="85%" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" className="pointer-events-none">
                            规模化合作
                        </text>

                        <Scatter
                            data={filteredData}
                            onClick={(data) => {
                                if (onInstitutionClick) {
                                    onInstitutionClick(data.country);
                                }
                            }}
                            onMouseEnter={(data) => setHoveredInstitution(data.name)}
                            onMouseLeave={() => setHoveredInstitution(null)}
                        >
                            {filteredData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.7} stroke="#fff" strokeWidth={1} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            {/* Legend - Top Countries */}
            <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-500 mb-2">Top Partner Countries (Click to Filter)</div>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(COUNTRY_COLORS).slice(0, 10).map(([country, color]) => {
                        const count = chartData.filter(d => d.country === country).length;
                        if (count === 0) return null;

                        const isSelected = selectedCountries.includes(country);
                        return (
                            <button
                                key={country}
                                onClick={() => toggleCountry(country)}
                                className={clsx(
                                    "px-2 py-1 rounded-md text-xs font-medium transition-all border",
                                    isSelected
                                        ? "bg-white shadow-sm border-slate-300 text-slate-700"
                                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                )}
                            >
                                <span
                                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                                    style={{ backgroundColor: color }}
                                />
                                {country.split(' ')[0]} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div className="bg-blue-50 rounded-lg p-2">
                    <div className="text-xs text-blue-600 font-semibold">Total Institutions</div>
                    <div className="text-lg font-bold text-blue-700">{filteredData.length}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-2">
                    <div className="text-xs text-orange-600 font-semibold">Avg Papers</div>
                    <div className="text-lg font-bold text-orange-700">
                        {(filteredData.reduce((sum, d) => sum + d.x, 0) / filteredData.length).toFixed(0)}
                    </div>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                    <div className="text-xs text-green-600 font-semibold">Avg CNCI</div>
                    <div className="text-lg font-bold text-green-700">
                        {(filteredData.reduce((sum, d) => sum + d.cnci, 0) / filteredData.length).toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollaborationBubbleChart;
