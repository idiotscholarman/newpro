import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { BookOpen, BarChart3, Info } from 'lucide-react';
import JournalImpactBubble from './JournalImpactBubble';
import JournalCardStream from './JournalCardStream';

const JournalAnalysisSection = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredJournal, setHoveredJournal] = useState(null);

    useEffect(() => {
        fetch('/data/journal_stats.json')
            .then(res => res.json())
            .then(jsonData => {
                setData(jsonData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load journal stats:", err);
                setLoading(false);
            });
    }, []);

    // Prepare Sorted Data for Card Stream (Top 50 by Citations)
    const cardStreamData = useMemo(() => {
        if (!data) return [];
        return [...data]
            .sort((a, b) => b.citations - a.citations)
            .slice(0, 50);
    }, [data]);

    if (loading) return <div className="p-12 text-center text-slate-400">Loading Journal Data...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-700 slide-in-from-bottom-4">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <BookOpen size={24} className="text-pink-600" />
                        发文期刊画像 (Journal Analysis)
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        分析本校 {data.length} 个发文期刊的学术影响力分布与分区结构
                    </p>
                </div>

                {/* Single View Indicator - No tabs needed anymore */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                    <BarChart3 size={16} />
                    <span className="text-xs font-bold">量质分布视图 (Impact vs Volume)</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-100">

                {/* 1. Main Visualization Zone - Always Bubble Chart */}
                <div className="p-4 min-h-[500px]">
                    <JournalImpactBubble
                        data={data}
                        hoveredJournal={hoveredJournal}
                        onHoverJournal={setHoveredJournal}
                    />
                </div>

                {/* 2. Shared Card Stream (Always Linked) */}
                <JournalCardStream
                    data={cardStreamData}
                    hoveredJournal={hoveredJournal}
                    onHoverJournal={setHoveredJournal}
                />
            </div>

            <div className="flex gap-2 text-xs text-slate-400 px-2">
                <Info size={14} />
                <span>Tip: 气泡大小代表总被引频次，颜色代表篇均被引 (蓝→红)。下方列表可横向滑动。</span>
            </div>
        </div>
    );
};

export default JournalAnalysisSection;
