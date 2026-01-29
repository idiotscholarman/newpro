import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, FileText, Activity } from 'lucide-react';
import clsx from 'clsx';

const INSTITUTION_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd']; // Blue shades for Top 1, 2, 3

const CollaborationBarChart = ({ data, metric = 'papers', onCountryClick }) => {
    const [selectedCountry, setSelectedCountry] = useState(null);

    // Process data: Top 10 countries with Top 3 institutions each
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Group by country
        const countryGroups = {};
        data.forEach(inst => {
            const country = inst.country || 'UNKNOWN';
            if (!countryGroups[country]) {
                countryGroups[country] = [];
            }
            countryGroups[country].push(inst);
        });

        // Sort countries by total metric value
        const countrySummary = Object.entries(countryGroups).map(([country, institutions]) => ({
            country,
            total: institutions.reduce((sum, inst) => sum + inst[metric], 0),
            institutions: institutions.sort((a, b) => b[metric] - a[metric])
        })).sort((a, b) => b.total - a.total);

        // Take Top 10 countries, Top 3 institutions each
        const top10Countries = countrySummary.slice(0, 10);

        return top10Countries.map(({ country, institutions }) => {
            const top3 = institutions.slice(0, 3);
            const result = {
                country: country.split(' ')[0], // Abbreviate for X-axis
                fullCountry: country,
                total: institutions.reduce((sum, inst) => sum + inst[metric], 0)
            };

            top3.forEach((inst, idx) => {
                result[`inst${idx + 1}`] = inst[metric];
                result[`inst${idx + 1}_name`] = inst.name;
                result[`inst${idx + 1}_cnci`] = inst.cnci;
            });

            return result;
        });
    }, [data, metric]);

    const handleBarClick = (entry) => {
        setSelectedCountry(entry.fullCountry);
        if (onCountryClick) {
            onCountryClick(entry.fullCountry);
        }
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || payload.length === 0) return null;

        const data = payload[0].payload;

        return (
            <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3 rounded-lg shadow-xl border border-white/10 max-w-[280px]">
                <div className="font-bold text-sm mb-2 border-b border-white/10 pb-1">{data.fullCountry}</div>
                {[1, 2, 3].map(idx => {
                    const name = data[`inst${idx}_name`];
                    const value = data[`inst${idx}`];
                    const cnci = data[`inst${idx}_cnci`];
                    if (!name) return null;

                    return (
                        <div key={idx} className="mb-2 last:mb-0 border-l-2 border-blue-400 pl-2">
                            <div className="text-xs font-bold text-blue-300">#{idx} {name}</div>
                            <div className="flex justify-between items-center mt-0.5">
                                <span className="text-[10px] text-slate-400 uppercase">{metric === 'papers' ? 'Papers' : 'Citations'}</span>
                                <span className="text-xs font-mono font-bold text-white ml-2">{value?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 uppercase font-mono">CNCI Index</span>
                                <span className="text-xs font-mono text-green-400 ml-2">{cnci?.toFixed(2)}</span>
                            </div>
                        </div>
                    );
                })}
                <div className="mt-3 pt-2 border-t border-white/10 text-xs flex justify-between items-center">
                    <span className="text-slate-400">该国合作总量:</span>
                    <span className="font-mono font-bold text-blue-400">{data.total?.toLocaleString()}</span>
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
                        <BarChart3 size={18} className="text-orange-500" />
                        核心合作国家与机构对比
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Top 10 Countries with Top 3 Partner Institutions
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, bottom: 60, left: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="country"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <YAxis
                            label={{
                                value: metric === 'papers' ? 'Collaboration Papers' : 'Total Citations',
                                angle: -90,
                                position: 'insideLeft',
                                style: { fontSize: 11, fill: '#64748b' }
                            }}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(203, 213, 225, 0.3)' }} />
                        <Legend
                            wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                            formatter={(value) => {
                                if (value === 'inst1') return '第一合作机构 (Top 1)';
                                if (value === 'inst2') return '第二合作机构 (Top 2)';
                                if (value === 'inst3') return '第三合作机构 (Top 3)';
                                return value;
                            }}
                        />

                        <Bar
                            dataKey="inst1"
                            fill={INSTITUTION_COLORS[0]}
                            radius={[4, 4, 0, 0]}
                            onClick={handleBarClick}
                            cursor="pointer"
                        />
                        <Bar
                            dataKey="inst2"
                            fill={INSTITUTION_COLORS[1]}
                            radius={[4, 4, 0, 0]}
                            onClick={handleBarClick}
                            cursor="pointer"
                        />
                        <Bar
                            dataKey="inst3"
                            fill={INSTITUTION_COLORS[2]}
                            radius={[4, 4, 0, 0]}
                            onClick={handleBarClick}
                            cursor="pointer"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Footer Note */}
            <div className="mt-3 text-xs text-slate-400 text-center">
                Click on bars to highlight country on map • Showing {metric === 'papers' ? 'Collaboration Papers' : 'Citation Impact'}
            </div>
        </div>
    );
};

export default CollaborationBarChart;
