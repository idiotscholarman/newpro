import React, { useMemo, useState } from 'react';
import { Trophy, TrendingUp, Users, ExternalLink, Award, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

const StrategicPartnerCards = ({ data, metric = 'papers', nameMap, externalHoveredNode, onHoverNode }) => {
    const [showAll, setShowAll] = useState(false);

    // Process top partners
    const { tier1, tier2 } = useMemo(() => {
        if (!data || data.length === 0) return { tier1: [], tier2: [] };

        // Sort by the selected metric (default papers)
        const sorted = [...data].sort((a, b) => b[metric] - a[metric]);

        return {
            tier1: sorted.slice(0, 3),   // Top 3 Strategic
            // Get slightly more for tier 2 to support "Show More" functionality
            tier2: sorted.slice(3, 30)
        };
    }, [data, metric]);

    const displayedTier2 = showAll ? tier2 : tier2.slice(0, 8);

    if (!data || data.length === 0) return null;

    return (
        <div className="space-y-8">
            {/* Tier 1 section */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Trophy size={20} className="text-yellow-500" />
                    核心战略合作伙伴 (Top 3 Strategic Partners)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tier1.map((inst, index) => {
                        const displayName = nameMap && nameMap[inst.name.toUpperCase()] ? nameMap[inst.name.toUpperCase()] : inst.name;
                        const isHovered = externalHoveredNode === inst.name;

                        return (
                            <div
                                key={inst.name}
                                className={clsx(
                                    "bg-white rounded-2xl border p-6 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer",
                                    isHovered ? "border-blue-500 ring-2 ring-blue-500 shadow-xl" : "border-blue-100"
                                )}
                                onMouseEnter={() => onHoverNode && onHoverNode(inst.name)}
                                onMouseLeave={() => onHoverNode && onHoverNode(null)}
                            >
                                {/* Rank Badge */}
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">
                                    #{index + 1}
                                </div>
                                {/* Background Decoration */}
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                                    <Award size={120} />
                                </div>

                                <div className="relative z-10">
                                    <div className="text-xs font-bold text-blue-600 mb-1">{inst.country}</div>
                                    <h4 className="text-lg font-bold text-slate-800 leading-tight mb-1 min-h-[56px] border-b border-slate-100 pb-2">
                                        {displayName}
                                    </h4>
                                    {nameMap && nameMap[inst.name.toUpperCase()] && <div className="text-xs text-slate-400 mb-3 truncate">{inst.name}</div>}

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                <Users size={16} />
                                                <span>合作发文量</span>
                                            </div>
                                            <span className="text-lg font-black text-slate-700">{inst.papers.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                <TrendingUp size={16} />
                                                <span>总被引频次</span>
                                            </div>
                                            <span className="text-md font-bold text-slate-700">{inst.citations.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg mt-2">
                                            <div className="text-xs text-slate-500 font-medium">学术影响力 (CNCI)</div>
                                            <div className={clsx(
                                                "text-sm font-bold",
                                                inst.cnci > 1 ? "text-green-600" : "text-orange-500"
                                            )}>
                                                {inst.cnci.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tier 2 Section */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Award size={20} className="text-blue-500" />
                    重点合作伙伴 (Key Partners)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {displayedTier2.map((inst, index) => {
                        const displayName = nameMap && nameMap[inst.name.toUpperCase()] ? nameMap[inst.name.toUpperCase()] : inst.name;
                        const isHovered = externalHoveredNode === inst.name;

                        return (
                            <div
                                key={inst.name}
                                className={clsx(
                                    "rounded-xl border p-4 transition-all flex flex-col justify-between group cursor-pointer h-full",
                                    isHovered
                                        ? "bg-blue-50 border-blue-400 shadow-md ring-1 ring-blue-400"
                                        : "bg-slate-50 border-slate-200 hover:bg-white hover:border-blue-200 hover:shadow-sm"
                                )}
                                onMouseEnter={() => onHoverNode && onHoverNode(inst.name)}
                                onMouseLeave={() => onHoverNode && onHoverNode(null)}
                            >
                                <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                                            {index + 4}
                                        </div>
                                        <div className="text-xs font-bold text-slate-400">{inst.country}</div>
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight mb-1" title={displayName}>
                                        {displayName}
                                    </div>
                                    {nameMap && nameMap[inst.name.toUpperCase()] && <div className="text-[10px] text-slate-400 truncate">{inst.name}</div>}
                                </div>

                                <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 mt-auto">
                                    <div className="text-center">
                                        <div className="text-xs font-bold text-slate-700">{inst.papers.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400">Papers</div>
                                    </div>
                                    <div className="text-center border-l border-slate-200 pl-2">
                                        <div className="text-xs font-bold text-orange-600">{inst.citations.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400">Citations</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Expand Button */}
                {tier2.length > 8 && (
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-bold hover:shadow-md hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                        >
                            {showAll ? (
                                <>
                                    <span>Collapse List</span>
                                    <ChevronUp size={16} />
                                </>
                            ) : (
                                <>
                                    <span>Show All (Top {tier2.length + 3})</span>
                                    <ChevronDown size={16} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrategicPartnerCards;
