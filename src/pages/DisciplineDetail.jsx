import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, BookOpen, Activity, Users, FileText, Globe, Award, Target
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line
} from 'recharts';

function cn(...inputs) {
    return inputs.filter(Boolean).join(' ');
}

// Mock data generator for demo purposes (until real data is connected)
const getMockTrend = () => Array.from({ length: 5 }, (_, i) => ({
    year: 2020 + i,
    value: Math.floor(Math.random() * 50) + 20
}));

const DisciplineDetail = () => {
    const { schoolId, disciplineName } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    // TODO: Fetch real discipline data using these IDs
    // const data = useDisciplineData(schoolId, disciplineName);

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">{decodeURIComponent(disciplineName)}</h1>
                            <span className="text-xs text-slate-500">学科分析详情</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                            ESI Top 1%
                        </span>
                    </div>
                </div>

                {/* Dimensions Tabs */}
                <div className="max-w-7xl mx-auto px-6 flex gap-6 overflow-x-auto scrollbar-hide">
                    {['overview', 'output', 'impact', 'collaboration'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                activeTab === tab
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            )}
                        >
                            {tab === 'overview' && '综合概览 Overview'}
                            {tab === 'output' && '科研产出 Output & Journals'}
                            {tab === 'impact' && '学术影响 Impact'}
                            {tab === 'collaboration' && '合作网络 Collaboration'}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
                {/* Demo Content for each Tab */}

                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                <div className="text-slate-400 text-xs mb-1">Global Rank</div>
                                <div className="text-2xl font-bold text-slate-800">#1,234</div>
                                <div className="text-emerald-500 text-xs mt-1">Top 0.5%</div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                <div className="text-slate-400 text-xs mb-1">Total Papers</div>
                                <div className="text-2xl font-bold text-slate-800">542</div>
                                <div className="text-blue-500 text-xs mt-1">+12% YoY</div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                <div className="text-slate-400 text-xs mb-1">Citations</div>
                                <div className="text-2xl font-bold text-slate-800">12,503</div>
                                <div className="text-blue-500 text-xs mt-1">+8% YoY</div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                <div className="text-slate-400 text-xs mb-1">Top Papers</div>
                                <div className="text-2xl font-bold text-slate-800">8</div>
                                <div className="text-amber-500 text-xs mt-1">High Impact</div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">学科总览</h3>
                            <p className="text-slate-600 leading-relaxed">
                                该学科目前处于国际前沿水平，近五年发文量稳步提升。主要贡献来自化学化工学院与材料学院。
                                优势方向集中在有机合成与纳米材料领域。
                                (此处为模拟文案，后续接入真实分析数据)
                            </p>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'output' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">历年发文趋势</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getMockTrend()}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="year" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Top 来源期刊</h3>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium text-slate-700">Journal of Example Science</span>
                                            <span className="text-sm text-slate-500">{20 - i} 篇</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Add impact and collaboration placeholders similarly */}
                {(activeTab === 'impact' || activeTab === 'collaboration') && (
                    <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        Data Integration in progress...
                    </div>
                )}

            </main>
        </div>
    );
};

export default DisciplineDetail;
