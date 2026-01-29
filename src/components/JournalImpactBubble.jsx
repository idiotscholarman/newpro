import React, { useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import { scaleLinear } from 'd3-scale';

const JournalImpactBubble = ({ data, hoveredJournal, onHoverJournal }) => {

    // Logic: X=Papers, Y=Citations, Color=CPP (Continuous Gradient)
    const chartData = useMemo(() => {
        if (!data) return [];

        // Find min/max CPP for color scale
        const cppValues = data.map(d => d.cpp);
        const minCpp = Math.min(...cppValues);
        const maxCpp = Math.max(...cppValues);

        // Sort by Citations so smaller bubbles might be on top (or reverse if desired)
        // Usually larger bubbles at bottom is better? Let's stick to Citations sort.
        return [...data]
            .sort((a, b) => b.citations - a.citations)
            .slice(0, 100) // Top 100
            .map(item => ({
                ...item,
                x: item.papers,
                y: item.citations,
                z: item.citations,
                cppNormalized: (item.cpp - minCpp) / (maxCpp - minCpp || 1)
            }));
    }, [data]);

    // Continuous Color Scale: Blue (Low) -> Cyan -> Green -> Yellow -> Red (High)
    // Custom interpolator
    const getCppColor = (t) => {
        // Multi-stop gradient logic
        if (t < 0.25) { // Blue -> Cyan
            const p = t / 0.25;
            return `rgb(${0}, ${Math.round(100 + p * 155)}, ${255})`;
        } else if (t < 0.5) { // Cyan -> Green
            const p = (t - 0.25) / 0.25;
            return `rgb(${0}, ${255}, ${Math.round(255 - p * 255)})`;
        } else if (t < 0.75) { // Green -> Yellow
            const p = (t - 0.5) / 0.25;
            return `rgb(${Math.round(p * 255)}, ${255}, ${0})`;
        } else { // Yellow -> Red
            const p = (t - 0.75) / 0.25;
            return `rgb(255, ${Math.round(255 - p * 255)}, ${0})`;
        }
    };

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        const info = payload[0].payload;
        return (
            <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-white/10 w-64 backdrop-blur-sm z-50">
                <div className="font-bold text-sm mb-2">{info.name}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-slate-400">发文量 (Volume)</div>
                    <div className="font-mono font-bold">{info.papers}</div>
                    <div className="text-slate-400">总被引 (Citations)</div>
                    <div className="font-mono font-bold text-orange-400">{info.citations}</div>
                    <div className="text-slate-400">篇均被引 (CPP)</div>
                    <div className="font-mono font-bold" style={{ color: getCppColor(info.cppNormalized) }}>
                        {info.cpp.toFixed(2)}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-[500px] w-full bg-slate-900 rounded-xl p-4 border border-slate-800 relative overflow-hidden flex flex-col">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Papers"
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            label={{ value: '发文量 (Volume)', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Citations"
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            label={{ value: '总被引频次 (Citations)', angle: -90, position: 'left', fill: '#64748b', fontSize: 12 }}
                        />
                        <ZAxis type="number" dataKey="z" range={[50, 1000]} name="Size" />

                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                        <Scatter
                            name="Journals"
                            data={chartData}
                            onMouseEnter={(node) => onHoverJournal(node.name)}
                            onMouseLeave={() => onHoverJournal(null)}
                        >
                            {chartData.map((entry, index) => {
                                const isHovered = hoveredJournal === entry.name;
                                const isDimmed = hoveredJournal && !isHovered;

                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={getCppColor(entry.cppNormalized)}
                                        fillOpacity={isDimmed ? 0.2 : 0.8}
                                        stroke={isHovered ? '#fff' : 'none'}
                                        strokeWidth={isHovered ? 2 : 0}
                                        style={{ transition: 'all 0.3s ease' }}
                                    />
                                );
                            })}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            {/* Continuous Color Legend */}
            <div className="absolute top-4 right-4 bg-slate-800/90 p-3 rounded-lg border border-slate-700 backdrop-blur-sm">
                <div className="text-[10px] text-slate-300 mb-1.5 font-bold flex justify-between">
                    <span>篇均被引 (CPP)</span>
                </div>
                <div className="w-32 h-3 rounded bg-gradient-to-r from-[rgb(0,100,255)] via-[rgb(0,255,0)] via-[rgb(255,255,0)] to-[rgb(255,0,0)] mb-1"></div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>Low</span>
                    <span>High</span>
                </div>
            </div>
        </div>
    );
};

export default JournalImpactBubble;
