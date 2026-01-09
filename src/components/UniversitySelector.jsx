import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Plus, Building2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import universityData from '../translated_mapping.json';

const MAX_SELECTION = 3;

const UniversitySelector = ({ selectedUniversities, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Convert dictionary to array for searching
    const universities = useMemo(() => {
        return Object.entries(universityData).map(([enName, cnName]) => ({
            enName,
            cnName,
            searchStr: `${enName.toLowerCase()} ${cnName}`
        }));
    }, []);

    const filteredUniversities = useMemo(() => {
        if (!searchTerm) return [];
        const lowerSearch = searchTerm.toLowerCase();
        return universities
            .filter(u => u.searchStr.includes(lowerSearch))
            .slice(0, 50); // Limit results for performance
    }, [searchTerm, universities]);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSelection = (uni) => {
        if (selectedUniversities.some(u => u.enName === uni.enName)) {
            onSelect(selectedUniversities.filter(u => u.enName !== uni.enName));
        } else {
            if (selectedUniversities.length >= MAX_SELECTION) return;
            onSelect([...selectedUniversities, uni]);
            setSearchTerm('');
            setIsOpen(false);
        }
    };

    const removeSelection = (enName) => {
        onSelect(selectedUniversities.filter(u => u.enName !== enName));
    };

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="text-blue-500" size={20} />
                        对标高校选择
                    </h3>
                    <p className="text-slate-500 text-sm">选择至多 3 所高校进行学科竞争力对比分析</p>
                </div>
                <div className="flex gap-2 text-xs font-medium bg-slate-50 px-3 py-1.5 rounded-lg text-slate-600">
                    已选: <span className="text-blue-600">{selectedUniversities.length}/{MAX_SELECTION}</span>
                </div>
            </div>

            <div className="relative" ref={dropdownRef}>
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        placeholder="输入中文或英文校名搜索..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                    />
                </div>

                {/* Dropdown Results */}
                <AnimatePresence>
                    {isOpen && searchTerm && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-[300px] overflow-y-auto"
                        >
                            {filteredUniversities.length > 0 ? (
                                <div className="p-2 space-y-1">
                                    {filteredUniversities.map((uni) => {
                                        const isSelected = selectedUniversities.some(u => u.enName === uni.enName);
                                        const isDisabled = !isSelected && selectedUniversities.length >= MAX_SELECTION;

                                        return (
                                            <button
                                                key={uni.enName}
                                                onClick={() => !isDisabled && toggleSelection(uni)}
                                                disabled={isDisabled}
                                                className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center transition-colors ${isSelected
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : isDisabled
                                                        ? 'opacity-50 cursor-not-allowed hover:bg-transparent'
                                                        : 'hover:bg-slate-50 text-slate-700'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="font-medium">{uni.cnName}</div>
                                                    <div className="text-xs text-slate-400 truncate max-w-[280px]">{uni.enName}</div>
                                                </div>
                                                {isSelected && <Check size={16} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    未找到相关高校
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-3 mt-4">
                <AnimatePresence>
                    {selectedUniversities.map((uni) => (
                        <motion.div
                            key={uni.enName}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white border border-blue-100 text-blue-700 rounded-lg shadow-sm text-sm hover:border-blue-200 transition-colors"
                        >
                            <span className="font-medium">{uni.cnName}</span>
                            <button
                                onClick={() => removeSelection(uni.enName)}
                                className="p-0.5 hover:bg-blue-100 rounded text-blue-400 hover:text-blue-600 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {selectedUniversities.length === 0 && (
                    <div className="text-sm text-slate-400 italic py-1.5">
                        暂未选择对标高校
                    </div>
                )}
            </div>
        </div>
    );
};

export default UniversitySelector;
