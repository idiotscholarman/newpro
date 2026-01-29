import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';
import { Target, Info } from 'lucide-react';

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
    'SWITZERLAND': '#f43f5e',
    'INDIA': '#22c55e'
};

const CollaborationCompass = ({ data, onInstitutionClick, nameMap, homeTotalCitations, externalHoveredNode, onHoverNode }) => {
    const [hoveredNode, setHoveredNode] = useState(null);

    // Filter and transform data
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // 1. Sort by CITATIONS (Strategic Importance) instead of papers
        // 2. Take top 50 for the compass view to keep it clean
        const topPartners = [...data]
            .sort((a, b) => b.citations - a.citations) // Sort by Citations
            .slice(0, 50);

        if (topPartners.length === 0) return [];

        // 3. Map to polar coordinates then to cartesian for plotting
        // Most Citations = Closest to center
        const maxCitations = topPartners[0].citations;

        return topPartners.map((inst, index) => {
            // Distance (r): Rank-based Distribution (Linear)
            // Index 0 (Rank 1) -> Closest
            // This guarantees that visual distance matches the ranking order perfectly
            const r = 20 + (index / topPartners.length) * 80;

            // Angle (theta): Golden angle distribution
            const angle = index * 137.5;
            const theta = (angle * Math.PI) / 180;

            return {
                ...inst,
                x: r * Math.cos(theta),
                y: r * Math.sin(theta),
                z: 50 + (inst.citations / maxCitations) * 800, // Size based on citations (bubble area)
                r: r,
                fill: COUNTRY_COLORS[inst.country] || '#94a3b8'
            };
        });
    }, [data]);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload[0]) return null;
        const data = payload[0].payload;

        // Don't show tooltip for center node (if we added one, but we handle center node separately)
        if (data.isCenter) return null;

        // Lookup Chinese name using UpperCase key
        const cnName = nameMap && nameMap[data.name.toUpperCase()];
        const displayName = cnName || data.name;

        return (
            <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3 rounded-xl shadow-xl border border-white/10 w-72 z-50">
                <div className="font-bold text-sm mb-1 line-clamp-2" title={displayName}>
                    {displayName}
                </div>
                {/* Only show original name if we are displaying a translation */}
                {cnName && <div className="text-[10px] text-slate-400 mb-1 truncate">{data.name}</div>}

                <div className="text-xs text-slate-400 mb-2 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.fill }}></span>
                    {data.country}
                </div>
                <div className="space-y-1.5 border-t border-white/10 pt-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400">合作论文 (Papers)</span>
                        <span className="font-mono font-bold text-blue-400">{data.papers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400">被引频次 (Citations)</span>
                        <span className="font-mono font-bold text-orange-400">{data.citations.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400">影响力 (CNCI)</span>
                        <span className="font-mono font-bold text-green-400">{data.cnci.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-white/5 pt-1 mt-1">
                        <span className="text-slate-400">贡献率 (Contribution)</span>
                        <span className="font-mono font-bold text-purple-400">
                            {((data.citations / (homeTotalCitations || 1)) * 100).toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const isAnyHovered = hoveredNode || externalHoveredNode;

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden relative scheme-dark text-white h-[600px] flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-6 z-10 bg-gradient-to-b from-slate-900/90 to-transparent pointer-events-none">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center gap-2">
                    <Target size={20} className="text-blue-400" />
                    战略合作罗盘 (Strategic Compass)
                </h3>
                <p className="text-sm text-slate-400 mt-1 max-w-xl">
                    以本校为中心，展示全球核心合作伙伴网络。距离圆心越近且球体越大，代表<b>总被引频次 (Total Citations)</b> 越高，学术影响力越强。
                </p>
            </div>

            {/* Orbit Zones (Background) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-[150px] h-[150px] border border-blue-500 rounded-full absolute"></div> {/* Inner Core */}
                <div className="w-[350px] h-[350px] border border-slate-600 rounded-full absolute border-dashed"></div> {/* Mid */}
                <div className="w-[550px] h-[550px] border border-slate-700 rounded-full absolute opacity-50"></div> {/* Outer */}
            </div>

            {/* Central Node (My University) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full shadow-[0_0_50px_rgba(37,99,235,0.5)] flex items-center justify-center border-4 border-slate-900 z-10">
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-blue-100 opacity-80 uppercase tracking-widest">Core</div>
                        <div className="text-xs font-black text-white">本校</div>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="w-full h-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        {/* Domain roughly -120 to 120 to fit our r=100 circle with padding */}
                        <XAxis type="number" dataKey="x" hide domain={[-120, 120]} />
                        <YAxis type="number" dataKey="y" hide domain={[-100, 100]} />
                        <ZAxis type="number" dataKey="z" range={[50, 800]} /> {/* Bubble size range */}
                        <Tooltip content={<CustomTooltip />} cursor={false} />

                        <Scatter
                            data={chartData}
                            onClick={(data) => onInstitutionClick && onInstitutionClick(data)}
                            onMouseEnter={(data) => {
                                setHoveredNode(data.name);
                                if (onHoverNode) onHoverNode(data.name);
                            }}
                            onMouseLeave={() => {
                                setHoveredNode(null);
                                if (onHoverNode) onHoverNode(null);
                            }}
                            cursor={{ strokeDasharray: '3 3' }}
                        >
                            {chartData.map((entry, index) => {
                                const isFocused = (hoveredNode === entry.name || externalHoveredNode === entry.name);
                                const isDimmed = isAnyHovered && !isFocused;

                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.fill}
                                        stroke="#fff"
                                        strokeWidth={isFocused ? 3 : 0}
                                        fillOpacity={isDimmed ? 0.2 : 0.9}
                                        style={{ transition: 'all 0.3s ease', outline: 'none', boxShadow: 'none' }}
                                        tabIndex={-1} // Remove from tab order to prevent focus
                                    />
                                );
                            })}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            {/* Legend - Dynamically Filtered */}
            <div className="absolute bottom-6 left-6 z-20 flex flex-wrap gap-x-4 gap-y-2 max-w-2xl pointer-events-auto">
                {Object.entries(COUNTRY_COLORS)
                    .filter(([country]) => chartData.some(d => d.country === country)) // Only show countries relevant to current view
                    .map(([country, color]) => (
                        <div key={country} className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur px-2 py-1 rounded-full border border-slate-700">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                            <span className="text-[10px] font-medium text-slate-300">{country}</span>
                        </div>
                    ))}
            </div>

            {/* Guidance */}
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 text-xs text-slate-500 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <Info size={14} />
                <span>Hover for stats</span>
            </div>
        </div>
    );
};

export default CollaborationCompass;
