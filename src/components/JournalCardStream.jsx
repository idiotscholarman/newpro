import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';

const JournalCardStream = ({ data, hoveredJournal, onHoverJournal }) => {
    const scrollContainerRef = useRef(null);
    const cardRefs = useRef({});

    // Auto-scroll to center the hovered journal
    useEffect(() => {
        if (hoveredJournal && cardRefs.current[hoveredJournal] && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const card = cardRefs.current[hoveredJournal];

            // Calculate center position
            const containerCenter = container.clientWidth / 2;
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;

            container.scrollTo({
                left: cardCenter - containerCenter,
                behavior: 'smooth'
            });
        }
    }, [hoveredJournal]);

    return (
        <div className="mt-6 border-t border-slate-100 pt-6 relative">
            <h4 className="text-xs font-bold text-slate-400 mb-3 px-1 uppercase tracking-wider flex justify-between items-center">
                <span>Top Journals ({data.length})</span>
                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">Auto-Focus Enabled</span>
            </h4>

            {/* Gradient Masks for "Infinity" feel */}
            <div className="absolute left-0 top-12 bottom-4 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-12 bottom-4 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

            <div
                ref={scrollContainerRef}
                className="overflow-x-auto pb-8 pt-4 hide-scrollbar px-[50%] snap-x snap-mandatory" // Padding 50% to allow first/last to center
                style={{ scrollBehavior: 'smooth' }}
            >
                <div className="flex gap-4 w-max">
                    {data.map((journal, index) => {
                        const isHovered = hoveredJournal === journal.name;

                        return (
                            <div
                                key={journal.name}
                                ref={el => cardRefs.current[journal.name] = el}
                                className={clsx(
                                    "w-[260px] shrink-0 bg-white rounded-xl p-4 border transition-all duration-300 relative group cursor-pointer snap-center",
                                    isHovered
                                        ? "border-blue-500 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)] scale-110 z-20 ring-4 ring-blue-500/10 -translate-y-2"
                                        : "border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md opacity-60 hover:opacity-100 scale-95 grayscale hover:grayscale-0"
                                )}
                                onMouseEnter={() => onHoverJournal(journal.name)}
                            // Don't clear on leave immediately to keep focus? 
                            // User asked for "default state first selected", so maybe we don't clear on leave if we want persistent focus.
                            // But if user moves mouse out, it might stay linked? Let's try standard hover logic but maybe maintain last active?
                            // For now standard hover logic is safer for unexpected interactions.
                            // onMouseLeave={() => onHoverJournal(null)} 
                            >
                                {/* Rank Badge */}
                                <div className={clsx(
                                    "absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-30 transition-opacity",
                                    isHovered ? "opacity-100" : "opacity-0"
                                )}>
                                    #{index + 1}
                                </div>

                                <div className="relative z-10">
                                    <div className="h-6 mb-2 flex items-center justify-between">
                                        <span className={clsx(
                                            "text-[10px] font-bold px-2 py-1 rounded-full",
                                            journal.jcr === 'Q1' ? 'bg-red-100 text-red-600' :
                                                journal.jcr === 'Q2' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-blue-100 text-blue-600'
                                        )}>
                                            {journal.jcr || 'N/A'}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                            CPP: {journal.cpp.toFixed(1)}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-slate-800 line-clamp-2 min-h-[3rem] mb-2 text-sm leading-snug text-center" title={journal.name}>
                                        {journal.name}
                                    </h4>

                                    <div className="flex bg-slate-50 rounded-lg p-2 mt-2 justify-between items-center text-xs">
                                        <div className="text-center w-1/2 border-r border-slate-200">
                                            <div className="text-[9px] text-slate-400 uppercase">发文量</div>
                                            <div className="font-black text-slate-700">{journal.papers}</div>
                                        </div>
                                        <div className="text-center w-1/2">
                                            <div className="text-[9px] text-slate-400 uppercase">总被引</div>
                                            <div className="font-black text-orange-500">{journal.citations}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Center Line Marker (Optional) */}
            {/* <div className="absolute left-1/2 top-24 bottom-4 w-px bg-blue-500/20 pointer-events-none -translate-x-1/2 z-0"></div> */}
        </div>
    );
};

export default JournalCardStream;
