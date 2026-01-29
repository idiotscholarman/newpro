import React, { useMemo } from 'react';

const JournalCloud = ({ data }) => {

    // Sort by papers to get top journals for the cloud/list
    const topJournals = useMemo(() => {
        if (!data) return [];
        return [...data].sort((a, b) => b.papers - a.papers).slice(0, 50);
    }, [data]);

    return (
        <div className="space-y-6">
            {/* 1. Tag Cloud Area (Stylized) */}
            <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm min-h-[300px] flex flex-wrap justify-center items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 pointer-events-none" />

                {topJournals.slice(0, 30).map((journal, index) => {
                    // Random-ish sizing based on rank (fake randomness for aesthetic)
                    const sizeClass =
                        index < 3 ? 'text-3xl font-black text-blue-700' :
                            index < 10 ? 'text-xl font-bold text-blue-600' :
                                index < 20 ? 'text-lg font-medium text-slate-600' :
                                    'text-sm text-slate-400';

                    const opacity = Math.max(0.4, 1 - index * 0.02);

                    return (
                        <span
                            key={index}
                            className={`${sizeClass} hover:text-orange-500 hover:scale-110 transition-all cursor-default select-none`}
                            style={{ opacity }}
                            title={`${journal.name} (Papers: ${journal.papers})`}
                        >
                            {journal.name}
                        </span>
                    );
                })}
            </div>

            {/* 2. Top Journals "Card Stream" */}
            <div className="overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex gap-4 w-max px-2">
                    {topJournals.slice(0, 15).map((journal, index) => (
                        <div
                            key={index}
                            className="min-w-[240px] bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group"
                        >
                            {/* Decorative ranking number */}
                            <div className="absolute top-2 right-2 text-[40px] font-black text-slate-100 -z-0 pointer-events-none">
                                #{index + 1}
                            </div>

                            <div className="relative z-10">
                                <div className="h-10 mb-2 flex items-center">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${journal.jcr === 'Q1' ? 'bg-red-100 text-red-600' :
                                            journal.jcr === 'Q2' ? 'bg-orange-100 text-orange-600' :
                                                'bg-blue-100 text-blue-600'
                                        }`}>
                                        {journal.jcr || 'N/A'}
                                    </span>
                                </div>

                                <h4 className="font-bold text-slate-800 line-clamp-2 min-h-[3rem] mb-2" title={journal.name}>
                                    {journal.name}
                                </h4>

                                <div className="flex justify-between items-end border-t border-slate-50 pt-3 mt-1">
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase">Papers</div>
                                        <div className="text-lg font-black text-slate-700">{journal.papers}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-400 uppercase">Impact (CPP)</div>
                                        <div className="text-sm font-bold text-green-600">{journal.cpp.toFixed(1)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-center text-xs text-slate-400">Scroll horizontally to view more Top Journals</p>
        </div>
    );
};

export default JournalCloud;
