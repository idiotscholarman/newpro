import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { Globe } from 'lucide-react';
import CollaborationCompass from '../components/CollaborationCompass';
import StrategicPartnerCards from '../components/StrategicPartnerCards';

const CollaborationInstitutionView = () => {
    const [instData, setInstData] = useState([]);
    const [nameMap, setNameMap] = useState({});
    const [homeTotalCitations, setHomeTotalCitations] = useState(0);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [metric, setMetric] = useState('citations'); // Default aligned with Compass logic
    const [regionFilter, setRegionFilter] = useState('all'); // 'all', 'domestic', 'foreign'

    useEffect(() => {
        // Parallel data fetching
        Promise.all([
            fetch('/data/collaboration_institutions.json').then(res => res.json()),
            fetch('/data/common.json').then(res => res.json()),
            fetch('/data/xnmz.json').then(res => res.json())
        ]).then(([rawData, commonData, xnmzData]) => {
            // 1. Process Institution Data
            const cleanData = rawData.filter(d => d.name !== 'Global Baseline' && d.papers > 0);
            setInstData(cleanData);

            // 2. Build Name Map (English -> Chinese)
            const map = {};
            if (commonData && commonData.rankings) {
                commonData.rankings.forEach(item => {
                    if (item.name && item.cnName) {
                        map[item.name.toUpperCase()] = item.cnName;
                    }
                });
            }
            setNameMap(map);

            // 3. Calculate Home Institution Total Citations (Sum of disciplines)
            // Note: xnmz.json contains discipline level stats. Summing them gives a good approximation of total impact.
            let totalCitations = 0;
            if (xnmzData && xnmzData.disciplines) {
                totalCitations = xnmzData.disciplines.reduce((sum, d) => sum + (d.citations || 0), 0);
            }
            // Fallback if zero (prevent divide by zero)
            if (totalCitations === 0) totalCitations = 1;
            setHomeTotalCitations(totalCitations);

        }).catch(err => console.error("Failed to load collaboration data:", err));
    }, []);

    // Filter Data based on selection
    const filteredData = useMemo(() => {
        if (!instData) return [];
        switch (regionFilter) {
            case 'domestic':
                return instData.filter(d => d.country === 'CHINA MAINLAND');
            case 'foreign':
                return instData.filter(d => d.country !== 'CHINA MAINLAND');
            default:
                return instData;
        }
    }, [instData, regionFilter]);

    const stats = useMemo(() => {
        if (!filteredData.length) return null;
        return {
            total: filteredData.length,
            highImpact: filteredData.filter(d => d.cnci > 1.2).length,
            highVolume: filteredData.filter(d => d.papers > 50).length,
            avgCnci: (filteredData.reduce((sum, d) => sum + d.cnci, 0) / filteredData.length).toFixed(2)
        };
    }, [filteredData]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-2">
                        <Globe size={24} className="text-blue-600" />
                        全球合作机构网络 (Global Partner Network)
                    </h2>
                    <p className="text-sm text-slate-500 max-w-2xl">
                        基于 Incites 数据库，分析本校与{regionFilter === 'domestic' ? '国内' : regionFilter === 'foreign' ? '国外+港澳台地区' : '全球'}
                        {stats ? stats.total : 0} 所科研机构的合作深度与广度。
                        <br />
                        <span className="text-xs text-slate-400">
                            平均影响力 (CNCI): {stats ? stats.avgCnci : 0} |
                            高水平合作伙伴: {stats ? stats.highImpact : 0}
                        </span>
                    </p>
                </div>

                {/* Region Filter Switch */}
                <div className="relative z-10 mt-4 md:mt-0 bg-slate-100/50 p-1 rounded-xl flex gap-1 border border-slate-200">
                    {[
                        { id: 'all', label: '全球 (Global)' },
                        { id: 'domestic', label: '国内 (Domestic)' },
                        { id: 'foreign', label: '国外+港澳台地区 (Foreign + HK/Macau/Taiwan)' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setRegionFilter(tab.id)}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                regionFilter === tab.id
                                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Background Pattern */}
                <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
            </div>

            {/* PART 1: Strategic Compass (The "Solar System") */}
            <CollaborationCompass
                data={filteredData}
                nameMap={nameMap}
                homeTotalCitations={homeTotalCitations}
                onInstitutionClick={(data) => console.log('Clicked:', data)}
                externalHoveredNode={hoveredNode}
                onHoverNode={setHoveredNode}
            />

            {/* PART 2: Core Tiers (Cards) */}
            <StrategicPartnerCards
                data={filteredData}
                nameMap={nameMap}
                metric={metric}
                onHoverNode={setHoveredNode}
                externalHoveredNode={hoveredNode}
            />
        </div>
    );
};

export default CollaborationInstitutionView;
