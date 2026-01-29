import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, TrendingUp, Settings, Menu, X, Download,
  ChevronRight, Activity, Award, Globe, Users, Building2, FileText, Target, ArrowUp, Trophy, Flame,
  ChevronDown, ChevronUp
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, LineChart, Line, CartesianGrid, AreaChart, Area, ComposedChart, Cell
} from 'recharts';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import nameMapping from '../translated_mapping.json';
import CooperationMap from '../components/CooperationMap';
import CollaborationInstitutionView from '../components/CollaborationInstitutionView';
import JournalAnalysisSection from '../components/JournalAnalysisSection';

const ESI_DISCIPLINES = [
  "Agricultural Sciences", "Biology & Biochemistry", "Chemistry", "Clinical Medicine",
  "Computer Science", "Economics & Business", "Engineering", "Environment/Ecology",
  "Geosciences", "Immunology", "Materials Science", "Mathematics", "Microbiology",
  "Molecular Biology & Genetics", "Multidisciplinary", "Neuroscience & Behavior",
  "Pharmacology & Toxicology", "Physics", "Plant & Animal Science", "Psychiatry/Psychology",
  "Social Sciences, General", "Space Science"
];

// --- 工具函数 (Utilities) ---

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 数值滚动组件
const CountUp = ({ value, duration = 2 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    // 处理可能包含逗号的字符串数值
    const end = typeof value === 'string' ? parseInt(value.replace(/,/g, ''), 10) : value;
    if (start === end) return;

    let totalFrame = 60 * duration;
    let increment = end / totalFrame;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(current));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

// --- 模拟数据 (Mock Data Analysis) ---

// --- 模拟数据 (Mock Data Analysis) ---
// dynamic load in component


// --- 数据处理 (Data Processing) ---

// Transform JSON data to match component expectations if necessary, 
// or ensure components use the JSON structure directly.
// The JSON structure is already quite close.
const transformData = (data) => {
  if (!data) return null;
  return {
    overview: {
      globalRank: data.overview?.globalRank || 1245,
      subjectsCount: data.overview?.subjectsCount || data.disciplines.filter(d => d.isTop1).length,
      totalCitations: data.overview?.totalCitations || data.disciplines.reduce((acc, d) => acc + (d.citations || 0), 0),
      top1Percent: data.overview?.top1Percent || data.disciplines.filter(d => !d.isTop1 && d.citations > 0 && parseFloat(d.potentialValue) > 50).length,
      institutionName: data.institution,
      totalPapers: data.overview?.totalPapers || data.disciplines.reduce((acc, d) => acc + (d.papers || 0), 0),
      topPapers: data.overview?.topPapers || data.disciplines.reduce((acc, d) => acc + (d.topPapers || 0), 0),
      globalRankChange: data.overview?.globalRankChange,
      totalCitationsChange: data.overview?.totalCitationsChange,
      totalPapersChange: data.overview?.totalPapersChange,
      // Rankings are now fetched from common.json or fallback to data.overview.rankings
      // rankings: data.overview?.rankings,
      domesticRank: data.overview?.domesticRank,
      publicationTrend: data.overview?.publicationTrend || [],
      domesticRank: data.overview?.domesticRank,
      publicationTrend: data.overview?.publicationTrend || [],
      topAuthors: data.overview?.topAuthors || [],
      // InCites数据（从学科累加）
      incitesPapers: data.disciplines.reduce((acc, d) => acc + (d.papers || 0), 0),
      incitesCitations: data.disciplines.reduce((acc, d) => acc + (d.citations || 0), 0)
    },
    disciplines: data.disciplines.filter(d => d.papers > 0 || d.citations > 0),
    colleges: (() => {
      // Aggregate Top Authors by Department to create College Stats
      if (!data.overview?.topAuthors) return [];
      const stats = {};

      data.overview.topAuthors.forEach(author => {
        const dept = author.dept || "Unknown";
        if (!stats[dept]) {
          stats[dept] = { name: dept, papers: 0, citations: 0, cpp: 0 };
        }
        stats[dept].papers += author.papers;
        stats[dept].citations += author.citations;
      });

      return Object.values(stats).map(s => ({
        ...s,
        cpp: s.papers > 0 ? parseFloat((s.citations / s.papers).toFixed(2)) : 0
      })).sort((a, b) => b.papers - a.papers);
    })(),
    benchmarking: [ // Placeholder, not used dynamically since we rely on dynamicBenchmarkData logic
    ],
    topPapers: data.overview?.topPapers || []
  };
};

// --- 组件 (Components) ---

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: '总览看板 (Overview)', active: true },
    { icon: BookOpen, label: '学科分析 (Disciplines)' },
    { icon: Target, label: '潜力预测 (Prediction)' },
    { icon: Users, label: '贡献度 (Contribution)' },
    { icon: Settings, label: '系统设置 (Settings)' },
  ];

  return (
    <>
      <div className={cn("fixed inset-0 bg-black/50 z-20 lg:hidden", isOpen ? "block" : "hidden")} onClick={toggleSidebar} />
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        className="fixed top-0 left-0 z-30 h-screen w-[280px] bg-[#0f172a] text-white shadow-2xl transition-transform duration-300 lg:relative lg:translate-x-0 border-r border-white/5"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ESI 学科决策支持
            </h1>
            <p className="text-xs text-slate-400 mt-1">Decision Support System</p>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-white/70 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item, idx) => (
            <a key={idx} href="#" className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-all group", item.active ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
              <item.icon size={20} />
              <span className="font-medium tracking-wide">{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="absolute bottom-6 left-0 w-full px-6">
          <div className="p-4 bg-gradient-to-br from-blue-900/50 to-slate-900 border border-blue-500/20 rounded-xl">
            <div className="text-xs text-blue-300 mb-1">本期数据更新</div>
            <div className="text-sm font-bold text-white">2026年1月</div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

const StatCard = ({ title, value, secondaryValue, secondaryLabel, subtext, icon: Icon, delay, change, isRank, onClick, className, comparisons }) => {
  // Logic for change display
  let isPositive = false;
  let changeColor = "";

  if (change !== undefined && change !== 0) {
    if (isRank) {
      isPositive = change > 0;
    } else {
      isPositive = change > 0;
    }
    changeColor = isPositive ? "text-emerald-500" : "text-rose-500";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
      transition={{ delay, duration: 0.5 }}
      onClick={onClick}
      className={cn("bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group", className)}
    >
      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={80} className="text-blue-600" />
      </div>
      <div className="text-slate-500 text-sm font-medium mb-2 flex items-center gap-2">
        {title}
      </div>
      <div className="flex items-end gap-3 mb-2">
        <div className="text-4xl font-bold text-slate-800 tracking-tight">
          <CountUp value={value} />
        </div>
        {change !== undefined && change !== 0 && (
          <div className={cn("flex items-center text-sm font-bold mb-1.5", changeColor)}>
            {isPositive ? (
              <TrendingUp size={16} className="mr-1" />
            ) : (
              <TrendingUp size={16} className="mr-1 rotate-180" />
            )}
            {Math.abs(change)}
          </div>
        )}
      </div>
      {secondaryValue !== undefined && (
        <div className="text-xs text-slate-400 -mt-1 mb-2">
          {secondaryLabel || 'InCites'}: <span className="font-medium text-slate-500">{typeof secondaryValue === 'number' ? secondaryValue.toLocaleString() : secondaryValue}</span>
        </div>
      )}
      {subtext && <div className="text-slate-500 text-sm font-medium -mt-1 mb-2">{subtext}</div>}

      {/* Benchmark Comparisons */}
      {comparisons && comparisons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
          {comparisons.map((comp, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-400 truncate max-w-[100px]" title={comp.name}>
                {comp.name.length > 8 ? comp.name.slice(0, 8) + '...' : comp.name}
              </span>
              <div className="text-right">
                <span className="font-bold" style={{ color: comp.color }}>
                  {isRank ? `#${comp.value}` : comp.value?.toLocaleString()}
                </span>
                {comp.secondaryValue !== undefined && (
                  <span className="text-slate-400 ml-1 font-normal">
                    ({comp.secondaryValue?.toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const PredictionCard = ({ discipline, delay, onClick }) => {
  const potential = parseFloat(discipline.potentialValue || 0);
  const isPreQualified = potential >= 100;

  return (
    <motion.div
      layoutId={`card-${discipline.name}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, backgroundColor: '#f8fafc' }}
      onClick={onClick}
      transition={{ delay, duration: 0.5 }}
      className={cn(
        "bg-white p-4 rounded-xl border mb-3 cursor-pointer group transition-all shadow-sm",
        isPreQualified ? "border-amber-200 bg-amber-50/30" : "border-slate-100 hover:border-blue-300"
      )}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-2 h-8 rounded-full", isPreQualified ? "bg-amber-500" : "bg-blue-500")}></div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 text-lg">{discipline.cnName}</h4>
              {isPreQualified && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                  准入围
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{discipline.name}</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
        <div className="bg-slate-50 p-2 rounded-lg">
          <span className="text-slate-400 block text-xs">引用 / 阈值</span>
          <span className="font-bold text-slate-700">{discipline.citations.toLocaleString()} / {discipline.threshold.toLocaleString()}</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg">
          <span className="text-slate-400 block text-xs">达标率 (潜力值)</span>
          <span className={cn("font-bold", potential > 80 ? "text-amber-600" : "text-blue-600")}>
            {discipline.potentialValue}%
          </span>
        </div>
      </div>

      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(potential, 100)}%` }}
          transition={{ duration: 1.2, delay: delay + 0.2 }}
          className={cn(
            "h-full rounded-full transition-all relative",
            potential > 80 ? "bg-gradient-to-r from-amber-400 to-amber-600" : "bg-gradient-to-r from-blue-400 to-blue-600"
          )}
        >
          <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const DetailPanel = ({ discipline, onClose }) => {
  if (!discipline) return null;
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 right-0 z-40 w-full md:w-[600px] bg-white shadow-2xl border-l border-slate-100 overflow-y-auto"
    >
      <div className="p-8">
        <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">ESI Discipline</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800">{discipline.cnName}</h2>
            <p className="text-slate-500 font-medium">{discipline.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors">
            <X size={28} />
          </button>
        </div>

        {/* 核心指标矩阵 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: '全球排名', value: `#${discipline.rank}`, icon: Activity, color: 'text-blue-600' },
            { label: '篇均被引', value: discipline.citationsPerPaper || (discipline.citations / (discipline.papers || 1)).toFixed(2), icon: FileText, color: 'text-purple-600' },
            { label: 'Top Paper 数量', value: discipline.topPapers || 0, icon: Award, color: 'text-amber-600' },
            { label: 'ESI百分位', value: `${discipline.percentile || 'N/A'}%`, icon: Globe, color: 'text-emerald-600' },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
              <div className={cn("p-3 rounded-lg bg-white shadow-sm", item.color)}>
                <item.icon size={24} />
              </div>
              <div>
                <div className="text-sm text-slate-500">{item.label}</div>
                <div className="text-xl font-bold text-slate-800">{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 趋势图表 */}
        <div className="mb-8 bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            近12个月被引频次增长趋势
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={discipline.trend}>
                <defs>
                  <linearGradient id="colorCit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="citations" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2">
          <Download size={20} />
          下载该学科详细分析报告 (PDF)
        </button>
      </div>
    </motion.div>
  );
};

const CitationAnalysisModal = ({ trend, authors, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: "被引趋势", id: 0 },
    { label: "篇均被引 & CNCI", id: 1 },
    { label: "相关作者", id: 2 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">论文被引与质量分析</h2>
            <p className="text-sm text-slate-500">Citation & Quality Analysis</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 0 && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-[400px]">
              <h3 className="text-sm font-bold text-slate-700 mb-4">历年被引频次趋势</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="citations" name="被引频次" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === 1 && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-[400px]">
              <h3 className="text-sm font-bold text-slate-700 mb-4">篇均被引 (CPP) 与 CNCI 综合分析</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" scale="band" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" label={{ value: 'CPP', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'CNCI', angle: 90, position: 'insideRight' }} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="cpp" name="本校 CPP" fill="#3b82f6" barSize={20} />
                  <Bar yAxisId="left" dataKey="baselineCpp" name="全球基准 CPP" fill="#94a3b8" barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="cnci" name="CNCI" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === 2 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="px-4 py-3">姓名</th>
                    <th className="px-4 py-3">部门</th>
                    <th className="px-4 py-3 text-right">论文</th>
                    <th className="px-4 py-3 text-right">被引</th>
                    <th className="px-4 py-3 text-right">篇均</th>
                    <th className="px-4 py-3 text-right">贡献率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {authors && authors.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{a.name}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs text-ellipsis overflow-hidden max-w-[150px]" title={a.dept}>{a.dept}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{a.papers}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{a.citations}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{a.cpp}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-blue-600 font-bold">{a.contribution}</td>
                    </tr>
                  ))}
                  {(!authors || authors.length === 0) && (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">暂无作者数据 (需更新脚本)</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const PaperTrendModal = ({ trend, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">近11年发文量趋势</h2>
            <p className="text-sm text-slate-500">Publication Output Trend (11 Years)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="h-[400px] w-full">
          {trend && trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="papers" name="Paper Count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
              暂无历史趋势数据 (需运行更新脚本)
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const RankingListModal = ({ rankings, currentName, onClose }) => {
  const scrollRef = React.useRef(null);
  const [regionFilter, setRegionFilter] = React.useState('universities'); // 默认选中大陆高校
  const [searchQuery, setSearchQuery] = React.useState('');

  // 根据筛选条件过滤数据
  const filteredRankings = React.useMemo(() => {
    if (!rankings) return [];

    let filtered = rankings;
    switch (regionFilter) {
      case 'china':
        // 包含中国大陆、香港、台湾、澳门
        filtered = rankings.filter(r =>
          r.region === 'CHINA MAINLAND' ||
          r.region === 'HONG KONG' ||
          r.region === 'TAIWAN' ||
          r.region === 'MACAU'
        );
        break;
      case 'mainland':
        // 仅中国大陆
        filtered = rankings.filter(r => r.region === 'CHINA MAINLAND');
        break;
      case 'universities':
        // 中国大陆高校：中文名包含"大学"或"学院"，但排除"科学院"、"研究生院"、"研究院"
        filtered = rankings.filter(r => {
          if (r.region !== 'CHINA MAINLAND') return false;
          const cnName = r.cnName || '';
          const hasUniversity = cnName.includes('大学') || cnName.includes('学院');
          const isExcluded = cnName.includes('科学院') || cnName.includes('研究生院') || cnName.includes('研究院');
          return hasUniversity && !isExcluded;
        });
        break;
      default:
        // 全球
        filtered = rankings;
    }

    // 重新计算筛选后的排名
    const ranked = filtered.map((item, index) => ({
      ...item,
      filteredRank: index + 1  // 筛选后的排名
    }));

    // 搜索过滤（支持中英文名）
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return ranked.filter(r =>
        (r.name && r.name.toLowerCase().includes(query)) ||
        (r.cnName && r.cnName.includes(searchQuery.trim()))
      );
    }

    return ranked;
  }, [rankings, regionFilter, searchQuery]);

  const scrollToMyUniv = () => {
    if (scrollRef.current) {
      const activeRow = scrollRef.current.querySelector('[data-is-me="true"]');
      if (activeRow) {
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    // Initial auto-scroll
    setTimeout(scrollToMyUniv, 300);
  }, [filteredRankings]);

  const filterLabels = {
    global: '全球',
    china: '中国',
    mainland: '中国大陆',
    universities: '大陆高校'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-3xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">ESI 全球机构排名</h2>
            <p className="text-slate-500 text-sm">Global Institutions Ranking by ESI</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={scrollToMyUniv}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
              title="定位到本校"
            >
              <Target size={16} />
              <span className="hidden sm:inline">定位本校</span>
            </button>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
              title="回到顶部"
            >
              <ArrowUp size={16} />
              <span className="hidden sm:inline">回到顶部</span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Region Filter Tabs */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50">
          {['global', 'china', 'mainland', 'universities'].map(filter => (
            <button
              key={filter}
              onClick={() => setRegionFilter(filter)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                regionFilter === filter
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {filterLabels[filter]}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="px-6 py-3 bg-white border-b border-slate-100">
          <input
            type="text"
            placeholder="搜索机构名称（中英文）..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-0 bg-white" ref={scrollRef}>
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 shadow-sm z-20 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4 bg-slate-50 text-center w-20">
                  {regionFilter === 'global' ? '全球排名' : regionFilter === 'china' ? '中国排名' : regionFilter === 'mainland' ? '大陆排名' : '高校排名'}
                </th>
                <th className="px-4 py-4 bg-slate-50">机构名称</th>
                {regionFilter === 'global' && <th className="px-4 py-4 bg-slate-50">地区</th>}
                <th className="px-4 py-4 text-right bg-slate-50">论文数</th>
                <th className="px-4 py-4 text-right bg-slate-50">被引频次</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredRankings && filteredRankings.length > 0 ? filteredRankings.map((r, idx) => {
                const isMe = r.name.toUpperCase() === currentName.toUpperCase() || r.cnName === currentName;
                return (
                  <tr
                    key={idx}
                    data-is-me={isMe}
                    className={cn(
                      "border-b border-slate-100 last:border-0 transition-colors",
                      isMe
                        ? "bg-blue-50/80 hover:bg-blue-100 relative z-0"
                        : "hover:bg-slate-50"
                    )}
                  >
                    <td className={cn("px-4 py-4 text-center font-medium", isMe ? "text-blue-700 font-bold" : "text-slate-600")}>
                      #{r.filteredRank}
                      {regionFilter !== 'global' && (
                        <span className="text-xs text-slate-400 ml-1">(#{r.rank})</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className={cn("text-base", isMe ? "text-blue-800 font-extrabold" : "text-slate-800 font-bold")}>
                        {r.cnName || r.name}
                      </div>
                      {r.cnName && r.cnName !== r.name && (
                        <div className={cn("text-xs font-normal mt-0.5", isMe ? "text-blue-600/80" : "text-slate-400")}>
                          {r.name}
                        </div>
                      )}
                      {isMe && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
                      )}
                    </td>
                    {regionFilter === 'global' && (
                      <td className={cn("px-4 py-4 text-sm", isMe ? "text-blue-700" : "text-slate-500")}>
                        {r.region || '-'}
                      </td>
                    )}
                    <td className={cn("px-4 py-4 text-right tabular-nums", isMe ? "text-blue-900 font-bold" : "text-slate-600")}>
                      {r.papers.toLocaleString()}
                    </td>
                    <td className={cn("px-4 py-4 text-right tabular-nums", isMe ? "text-blue-900 font-bold" : "text-slate-600")}>
                      {r.citations.toLocaleString()}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={regionFilter === 'global' ? 5 : 4} className="px-6 py-12 text-center text-slate-400">
                    暂无排名数据 (No Data Available)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 bg-white text-xs text-slate-400 flex justify-between shrink-0 z-10">
          <span>{filterLabels[regionFilter]}共 {filteredRankings ? filteredRankings.length : 0} 个机构</span>
          <span>Source: Clarivate Analytics ESI 2026/01</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TopPaperListModal = ({ onClose }) => {
  const [papers, setPapers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/data/top_papers.json')
      .then(res => res.json())
      .then(data => {
        // 按年份降序排序
        data.sort((a, b) => b.year - a.year);
        setPapers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load top papers:', err);
        setLoading(false);
      });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Award className="text-amber-500" />
              ESI 高被引与热点论文 (Top Papers)
            </h2>
            <p className="text-slate-500 text-sm mt-1">Total: {papers.length} Papers (Highly Cited / Hot)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Loading papers...</div>
          ) : papers.length > 0 ? (
            papers.map((paper, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                {/* 装饰性背景 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-full -z-0 opacity-50"></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex gap-2 mb-2">
                      {paper.isHot && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-red-200"><Flame size={12} fill="currentColor" /> Hot Paper</span>}
                      {paper.isHighlyCited && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-200"><Trophy size={12} /> Highly Cited</span>}
                    </div>
                  </div>

                  <a
                    href={paper.doi ? `https://doi.org/${paper.doi}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold text-blue-700 hover:underline leading-tight block mb-2"
                    title="Click to view on DOI.org"
                  >
                    {paper.title}
                  </a>

                  <div className="text-sm text-slate-600 mb-3 line-clamp-2" title={paper.authors.join('; ')}>
                    <span className="font-semibold text-slate-700">Authors:</span> {paper.authors.join('; ')}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100 w-fit">
                    <div className="font-medium text-slate-700 italic">{paper.journal}</div>
                    <div className="flex items-center gap-4">
                      <span>Year: {paper.year}</span>
                      {paper.volume && <span>Vol: {paper.volume}</span>}
                      {paper.issue && <span>Issue: {paper.issue}</span>}
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {/* 显示本校匹配的学院 */}
                    {paper.colleges && paper.colleges.map(c => (
                      <span key={c} className="inline-flex items-center bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-md font-bold border border-indigo-200 shadow-sm">
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Abstract & Keywords */}
                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 group">
                    {paper.abstract && (
                      <div className="mb-2">
                        <span className="font-semibold text-slate-700 block mb-1">Abstract:</span>
                        <p className="line-clamp-3 group-hover:line-clamp-none transition-all duration-300 text-justify leading-relaxed">
                          {paper.abstract}
                        </p>
                      </div>
                    )}
                    {paper.keywords && (
                      <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
                        <span className="font-semibold text-slate-600">Keywords:</span> {paper.keywords}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              No Top Papers found.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};


// ... (Previous imports remain, ensure useNavigate is imported)


// ... (Utility functions remain)

const BenchmarkModal = ({ isOpen, onClose, lookup, selected, onSelect, cnMap }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const results = search.length > 1 && lookup
    ? Object.keys(lookup).filter(k => {
      const cn = cnMap[k] || '';
      const sUpper = search.toUpperCase();
      return k.includes(sUpper) || cn.includes(search);
    }).slice(0, 50)
    : [];

  const toggleSelection = (nameKey) => {
    const isSelected = selected.some(s => s.name.toUpperCase() === nameKey);
    if (isSelected) {
      onSelect(selected.filter(s => s.name.toUpperCase() !== nameKey));
    } else {
      if (selected.length >= 3) {
        alert("最多选择 3 所对标高校 (Max 3 benchmarks)");
        return;
      }
      const data = lookup[nameKey];
      const displayName = cnMap[nameKey] || nameKey;

      onSelect([...selected, {
        name: nameKey, // Original Key (English typically)
        cnName: displayName, // Chinese if available
        rank: data.rank,
        papers: data.papers,
        citations: data.citations
      }]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800">选择对标高校</h2>
            <p className="text-sm text-slate-500">Select Benchmark Institutions (Total: {lookup ? Object.keys(lookup).length.toLocaleString() : 0})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 border-b border-slate-100 bg-slate-50 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {selected.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200 shadow-sm">
                <span className="truncate max-w-[150px]">{s.cnName || s.name}</span>
                <button onClick={() => onSelect(selected.filter(x => x !== s))} className="hover:text-blue-900"><X size={14} /></button>
              </div>
            ))}
            {selected.length === 0 && <span className="text-slate-400 text-sm italic py-1.5">未选择高校 (No selection)</span>}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="输入中英文校名搜索 (Search by English or Chinese name)..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="absolute left-3 top-3 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map(instKey => {
                const isSelected = selected.some(s => s.name.toUpperCase() === instKey);
                const info = lookup[instKey];
                const cnName = cnMap[instKey];

                return (
                  <button
                    key={instKey}
                    onClick={() => toggleSelection(instKey)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg flex justify-between items-center transition-colors",
                      isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <div>
                      <div className={cn("font-bold text-sm", isSelected ? "text-blue-800" : "text-slate-700")}>
                        {cnName || instKey}
                      </div>
                      <div className="text-xs text-slate-400 flex gap-3 mt-1 items-center">
                        {cnName && <span className="mr-2 text-slate-500 font-medium">{instKey}</span>}
                        <span className="bg-slate-100 px-1.5 rounded text-slate-500">#{info.rank}</span>
                        <span className="text-slate-300">|</span>
                        <span>Papers: {info.papers}</span>
                      </div>
                    </div>
                    {isSelected && <div className="text-blue-600"><Target size={18} /></div>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10">
              {search.length <= 1 ? "请输入至少 2 个字符 (Type >1 chars)" : "未找到匹配高校 (No match)"}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};



const SubjectSelectModal = ({ isOpen, onClose, selected, onSelect }) => {
  if (!isOpen) return null;

  const toggle = (d) => {
    if (selected.includes(d)) {
      onSelect(selected.filter(s => s !== d));
    } else {
      if (selected.length >= 8) return alert("最多选择8个学科 (Max 8 subjects)");
      onSelect([...selected, d]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="font-bold text-lg">选择对标学科 ({selected.length}/8)</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm max-h-[60vh] overflow-y-auto">
          {ESI_DISCIPLINES.map(d => (
            <div
              key={d}
              onClick={() => toggle(d)}
              className={cn(
                "p-2 rounded cursor-pointer flex items-center justify-between border transition-colors",
                selected.includes(d) ? "bg-blue-50 border-blue-500 text-blue-700" : "hover:bg-slate-50 border-slate-200"
              )}
            >
              <span>{d}</span>
              {selected.includes(d) && <div className="w-2 h-2 rounded-full bg-blue-500" />}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">完成 (Done)</button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();

  // State for sorting authors
  const [authorSortConfig, setAuthorSortConfig] = useState({ key: 'papers', direction: 'desc' });

  // Create normalized Chinese mapping

  // Create normalized Chinese mapping
  const cnMap = React.useMemo(() => {
    const map = {};
    if (nameMapping) {
      Object.entries(nameMapping).forEach(([k, v]) => {
        map[k.toUpperCase().trim()] = v;
      });
    }
    return map;
  }, []);

  const [realData, setRealData] = useState(null);
  const [collegeStats, setCollegeStats] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('output'); // 'output' | 'impact'
  const [benchmarkModalOpen, setBenchmarkModalOpen] = useState(false);
  const [selectedBenchmarks, setSelectedBenchmarks] = useState([]);

  const [rankingModalOpen, setRankingModalOpen] = useState(false);
  const [showTopPaperModal, setShowTopPaperModal] = useState(false);

  // Radar Chart State
  const [radarMetric, setRadarMetric] = useState('citations'); // 'papers', 'citations', 'cpp'
  const [radarSubjects, setRadarSubjects] = useState([]);
  const [radarModalOpen, setRadarModalOpen] = useState(false);
  const [showAllPotential, setShowAllPotential] = useState(false);

  // Restored modal states
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  const [paperTrendModalOpen, setPaperTrendModalOpen] = useState(false);
  const [citationModalOpen, setCitationModalOpen] = useState(false);

  // Benchmark data for dynamic comparison
  const [benchmarkSchoolData, setBenchmarkSchoolData] = useState({});
  const [benchmarkLookup, setBenchmarkLookup] = useState(null);
  const [esiThresholds, setEsiThresholds] = useState({});

  // Load benchmark lookup data on mount
  useEffect(() => {
    fetch('/data/benchmark_data.json')
      .then(r => r.ok ? r.json() : {})
      .then(data => setBenchmarkLookup(data))
      .catch(() => setBenchmarkLookup({}));

    // Load detailed ESI thresholds
    fetch('/data/esi_thresholds.json')
      .then(r => r.ok ? r.json() : {})
      .then(data => setEsiThresholds(data))
      .catch(() => setEsiThresholds({}));

    // 加载学院贡献数据（基于WOS全记录解析）
    fetch('/data/college_stats.json')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCollegeStats(data))
      .catch(() => setCollegeStats([]));
  }, []);

  // Load benchmark school data when selections change
  useEffect(() => {
    if (selectedBenchmarks.length === 0 || !benchmarkLookup) {
      setBenchmarkSchoolData({});
      return;
    }

    // Use real benchmark data from lookup
    const realBenchmarkData = {};
    selectedBenchmarks.forEach(school => {
      const nameKey = school.name.toUpperCase();
      const lookupData = benchmarkLookup[nameKey];

      // Calculate InCites totals from details
      let incitesPapers = 0;
      let incitesCitations = 0;
      if (lookupData?.details) {
        Object.values(lookupData.details).forEach(d => {
          if (d.incites) {
            incitesPapers += d.incites[0] || 0;
            incitesCitations += d.incites[1] || 0;
          }
        });
      }

      realBenchmarkData[school.cnName || school.name] = {
        name: school.cnName || school.name,
        nameKey: nameKey,
        // From rankings (already in selectedBenchmarks) - ESI data
        rank: school.rank,
        papers: school.papers,
        citations: school.citations,
        // From benchmark_data.json
        topPapers: lookupData?.topPapers || 0,
        esiDisciplines: lookupData?.esiDisciplines || 0,
        potentialDisciplines: lookupData?.potentialDisciplines || 0,
        details: lookupData?.details || {},
        // InCites totals
        incitesPapers,
        incitesCitations
      };
    });
    setBenchmarkSchoolData(realBenchmarkData);
  }, [selectedBenchmarks, benchmarkLookup]);

  // Init default radar subjects
  useEffect(() => {
    if (realData && radarSubjects.length === 0) {
      // Default: Top 1% + Potential > 50%
      const defaults = realData.disciplines
        .filter(d => d.isTop1 || (d.potentialValue && parseFloat(d.potentialValue) > 50))
        .map(d => d.name)
        .slice(0, 6);
      setRadarSubjects(defaults.length > 0 ? defaults : ['Chemistry', 'Engineering', 'Materials Science']);
    }
  }, [realData]);

  // Generate dynamic benchmarking data for radar chart with Log Scale
  const dynamicBenchmarkData = React.useMemo(() => {
    if (!realData || radarSubjects.length === 0) return [];

    return radarSubjects.map(subject => {
      // 1. Calculate Raw Values
      const rawValues = {};
      const sources = {};

      // MyUni
      const myDisc = realData.disciplines.find(d => d.name === subject);
      const myP = myDisc?.papers || 0;
      const myC = myDisc?.citations || 0;
      rawValues.MyUni = radarMetric === 'papers' ? myP : radarMetric === 'citations' ? myC : (myC / (myP || 1));

      // ESI Threshold (门槛值) - use specific threshold from esi_thresholds.json
      // Helper to normalize strings for matching
      // Remove digits (key prefix) and non-letters, then uppercase
      const normalize = (s) => s.replace(/^\d+/, '').replace(/[^a-zA-Z]/g, '').toUpperCase();
      const normSubject = normalize(subject);

      let thresholdVal = 0;
      // Stricter matching: 
      // 1. Exact match (after normalization) to avoid "Chemistry" matching "Biochemistry"
      // 2. Fallback: try finding key that starts with subject (e.g. subject="Social Sciences", key="21Social Sciences, General")
      let thresholdKey = Object.keys(esiThresholds).find(k => normalize(k) === normSubject);

      if (!thresholdKey) {
        thresholdKey = Object.keys(esiThresholds).find(k => normalize(k).startsWith(normSubject));
      }

      // If absolutely distinct mismatch issues persist, we might need a map, but this covers known cases.
      const thresholdData = esiThresholds[thresholdKey];

      if (thresholdData) {
        if (radarMetric === 'papers') {
          thresholdVal = thresholdData.papers;
        } else if (radarMetric === 'citations') {
          thresholdVal = thresholdData.citations;
        } else {
          // cpp
          thresholdVal = thresholdData.cpp;
        }
      } else {
        // Fallback to old logic if specific threshold not found
        const oldThreshold = myDisc?.threshold || 0;
        thresholdVal = radarMetric === 'papers' ? Math.round(oldThreshold / 17) : radarMetric === 'citations' ? oldThreshold : 17;
      }

      // Store threshold value for display
      rawValues.ESI门槛 = thresholdVal;

      // Determine Source & ESI Value
      const esiP = myDisc?.esiPapers || 0;
      const esiC = myDisc?.esiCitations || 0;
      const hasESI = esiP > 0 || (myDisc?.esiRank && myDisc.esiRank !== '未入围');

      const esiValues = {};
      if (hasESI) {
        esiValues.MyUni = radarMetric === 'papers' ? esiP : radarMetric === 'citations' ? esiC : (esiC / (esiP || 1));
        sources.MyUni = 'ESI'; // Label as ESI for tooltip
      } else {
        sources.MyUni = myDisc?.papers > 0 ? 'InCites' : 'N/A';
      }

      Object.entries(benchmarkSchoolData).forEach(([schoolName, schoolData]) => {
        // More robust matching: try multiple approaches
        const detailsKeys = Object.keys(schoolData.details || {});
        let detailsKey = null;

        // 1. First try: exact normalized endsWith match
        detailsKey = detailsKeys.find(k => normalize(k).endsWith(normSubject));

        // 2. Second try: normalized includes match
        if (!detailsKey) {
          detailsKey = detailsKeys.find(k => normalize(k).includes(normSubject));
        }

        // 3. Third try: subject includes key (for shorter key names)
        if (!detailsKey) {
          detailsKey = detailsKeys.find(k => normSubject.includes(normalize(k).replace(/^\d+/, '')));
        }

        const details = schoolData.details?.[detailsKey];
        if (details) {
          // New structure: { esi: [papers, cites], incites: [papers, cites] }
          // Use InCites for visual (rawValues), store ESI separately for tooltip
          const incitesData = details.incites || details.esi || (Array.isArray(details) ? details : null);
          const esiData = details.esi;

          if (incitesData) {
            const p = incitesData[0] || 0;
            const c = incitesData[1] || 0;
            rawValues[schoolName] = radarMetric === 'papers' ? p : radarMetric === 'citations' ? c : (c / (p || 1));
            sources[schoolName] = esiData ? 'ESI' : 'InCites';

            // Store ESI values for tooltip if available
            if (esiData) {
              const esiP = esiData[0] || 0;
              const esiC = esiData[1] || 0;
              esiValues[schoolName] = radarMetric === 'papers' ? esiP : radarMetric === 'citations' ? esiC : (esiC / (esiP || 1));
            }
          } else {
            rawValues[schoolName] = 0;
            sources[schoolName] = 'N/A';
          }
        } else {
          rawValues[schoolName] = 0; // If not in Top 1%, value is significantly lower or considered 0 for ESI comparison
          sources[schoolName] = 'N/A';
        }
      });

      // 2. Find Max for this subject
      const args = Object.values(rawValues);
      const maxVal = Math.max(...args) || 1; // Avoid divide by zero

      // 3. Normalize to 0-100
      const item = {
        subject: nameMapping[subject] || subject,
        fullSubject: subject,
        maxReference: maxVal
      };

      Object.entries(rawValues).forEach(([key, val]) => {
        // Linear scale
        item[key] = (val / maxVal) * 100;
        item[`${key}_Raw`] = val;
        // Inject ESI value if available, otherwise undefined
        if (esiValues[key] !== undefined) {
          item[`${key}_ESI`] = esiValues[key];
        }
        item[`${key}_Source`] = sources[key];
      });

      return item;
    });
  }, [realData, radarSubjects, benchmarkSchoolData, radarMetric, esiThresholds]);

  // Sorting for Colleges
  const [collegeSortConfig, setCollegeSortConfig] = useState({ key: 'papers', direction: 'desc' });

  const sortedColleges = React.useMemo(() => {
    if (!collegeStats || collegeStats.length === 0) return [];
    const sorted = [...collegeStats];
    sorted.sort((a, b) => {
      let aVal = a[collegeSortConfig.key];
      let bVal = b[collegeSortConfig.key];

      // Parse percentages/strings if needed (for other columns if added)
      if (typeof aVal === 'string') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      if (aVal < bVal) return collegeSortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return collegeSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [collegeStats, collegeSortConfig]);

  const handleCollegeSort = (key) => {
    setCollegeSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Calculate dynamic domain for Radar Chart
  const radarDomain = React.useMemo(() => {
    return [0, 100];
  }, []);


  // Sorted Authors Data
  const sortedAuthors = React.useMemo(() => {
    if (!realData?.overview?.topAuthors) return [];
    return [...realData.overview.topAuthors].sort((a, b) => {
      let valA = a[authorSortConfig.key];
      let valB = b[authorSortConfig.key];

      if (typeof valA === 'string' && valA.includes('%')) valA = parseFloat(valA);
      if (typeof valB === 'string' && valB.includes('%')) valB = parseFloat(valB);

      if (valA < valB) return authorSortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return authorSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [realData, authorSortConfig]);

  const handleAuthorSort = (key) => {
    setAuthorSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  useEffect(() => {
    setLoading(true);
    const id = schoolId || 'xnmz';
    Promise.all([
      fetch(`/data/${id}.json`).then(r => { if (!r.ok) throw new Error('Data not found'); return r.json(); }),
      fetch('/data/common.json').then(r => { if (!r.ok) return { rankings: [] }; return r.json(); }).catch(() => ({ rankings: [] }))
    ])
      .then(([schoolData, commonData]) => {
        const mergedRankings = commonData.rankings?.length > 0 ? commonData.rankings : (schoolData.overview?.rankings || []);
        const transformed = transformData(schoolData);
        setRealData(transformed);
        setRankings(mergedRankings);
        // 注意：collegeStats 从 college_stats.json 单独加载，不要覆盖
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [schoolId]);

  if (loading) return ( /* Loading Spinner */ <div className="p-10 text-center">Loading...</div>);
  if (error || !realData) return ( /* Error View */ <div className="p-10 text-center">Error: {error}</div>);

  const handleDisciplineClick = (discipline) => {
    navigate(`/report/${schoolId}/discipline/${encodeURIComponent(discipline.name)}`);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 overflow-y-auto h-screen relative lg:pr-[280px]">
        {/* Header */}
        <header className="lg:hidden bg-white p-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <h1 className="text-lg font-bold text-slate-800">ESI 学科分析</h1>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600"><Menu size={24} /></button>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 pb-24">

          {/* Top Info Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg text-white"><Building2 size={24} /></div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{realData.overview.institutionName}</h2>
              </div>
              <p className="text-slate-500">基于 ESI 数据库 (Clarivate Analytics) 最新统计</p>
            </div>
            {/* Benchmark Button */}
            <button onClick={() => setBenchmarkModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-400 text-slate-600 rounded-lg font-medium transition-all shadow-sm">
              <Building2 size={18} /> <span>选择对标高校</span>
            </button>
          </div>

          {/* Core KPI Cards - Clicking them now just scrolls or focuses, no modal for simple ones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="ESI 全球机构排名"
              value={realData.overview.globalRank}
              subtext={`国内高校排名 #${realData.overview.domesticRank || '-'}`}
              icon={Globe}
              isRank={true}
              onClick={() => setRankingModalOpen(true)}
              className="cursor-pointer hover:border-blue-300"
              comparisons={selectedBenchmarks.slice(0, 3).map((s, i) => ({
                name: s.cnName || s.name,
                value: s.rank,
                color: ['#10b981', '#f59e0b', '#ef4444'][i]
              }))}
            />
            <StatCard
              title="总论文数"
              value={realData.overview.totalPapers}
              secondaryValue={realData.overview.incitesPapers}
              secondaryLabel="InCites"
              icon={FileText}
              onClick={() => setActiveTab('output')}
              className="cursor-pointer hover:border-blue-300"
              comparisons={Object.values(benchmarkSchoolData).slice(0, 3).map((s, i) => ({
                name: s.name,
                value: s.papers,
                secondaryValue: s.incitesPapers,
                color: ['#10b981', '#f59e0b', '#ef4444'][i]
              }))}
            />
            <StatCard
              title="总被引频次"
              value={realData.overview.totalCitations}
              secondaryValue={realData.overview.incitesCitations}
              secondaryLabel="InCites"
              icon={Activity}
              onClick={() => setActiveTab('citations')}
              className="cursor-pointer hover:border-blue-300"
              comparisons={Object.values(benchmarkSchoolData).slice(0, 3).map((s, i) => ({
                name: s.name,
                value: s.citations,
                secondaryValue: s.incitesCitations,
                color: ['#10b981', '#f59e0b', '#ef4444'][i]
              }))}
            />
            <StatCard
              title="Top Paper 数"
              value={realData.overview.topPapers}
              icon={Award}
              onClick={() => setShowTopPaperModal(true)}
              className="cursor-pointer hover:border-blue-300"
              comparisons={Object.values(benchmarkSchoolData).slice(0, 3).map((s, i) => ({
                name: s.name,
                value: s.topPapers,
                color: ['#10b981', '#f59e0b', '#ef4444'][i]
              }))}
            />
            <StatCard
              title="入围前1%学科数"
              value={realData.overview.subjectsCount}
              icon={BookOpen}
              comparisons={Object.values(benchmarkSchoolData).slice(0, 3).map((s, i) => ({
                name: s.name,
                value: s.esiDisciplines,
                color: ['#10b981', '#f59e0b', '#ef4444'][i]
              }))}
            />
            <StatCard
              title="潜力学科数 (>50%)"
              value={realData.overview.top1Percent}
              icon={Target}
              comparisons={Object.values(benchmarkSchoolData).slice(0, 3).map((s, i) => ({
                name: s.name,
                value: s.potentialDisciplines,
                color: ['#10b981', '#f59e0b', '#ef4444'][i]
              }))}
            />
          </div>

          {/* Radar Chart Section (Full Width) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Activity size={20} /></div>
                  <h3 className="text-xl font-bold text-slate-800">学科竞争力对标透视</h3>
                </div>
                <p className="text-slate-500 text-sm mt-1 ml-11">多维指标对比分析 (Multidimensional Analysis)</p>
              </div>
              <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
                {[{ id: 'papers', label: '发文量' }, { id: 'citations', label: '被引频次' }, { id: 'cpp', label: '篇均被引' }].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setRadarMetric(m.id)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                      radarMetric === m.id ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
                <button onClick={() => setRadarModalOpen(true)} className="ml-2 px-2 hover:bg-slate-200 rounded text-slate-400">
                  <Settings size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Legend/Info */}
              <div className="lg:col-span-1 space-y-4">
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600 shadow-sm"></div>
                    <span className="font-bold text-slate-800">本校 ({realData.overview.institutionName})</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500 pl-5">
                    <div>当前指标: {radarMetric === 'papers' ? '发文量' : radarMetric === 'citations' ? '总被引' : '篇均被引'}</div>
                    <div>对标学科数: {radarSubjects.length}/8</div>
                  </div>
                </div>

                {/* ESI Threshold Legend */}
                <div className="p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-300 flex items-center gap-3">
                  <div className="w-8 h-0.5 border-t-2 border-dashed border-slate-400"></div>
                  <div>
                    <span className="text-sm text-slate-600 font-medium">{radarMetric === 'citations' ? 'ESI入围门槛' : 'ESI末位均值'}</span>
                    <div className="text-xs text-slate-400">
                      {radarMetric === 'citations'
                        ? '入围ESI全球前1%的最低被引次数'
                        : 'ESI上榜机构中排名最后5%的平均水平'}
                    </div>
                  </div>
                </div>

                {selectedBenchmarks.map((s, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#10b981', '#f59e0b', '#ef4444'][i] }}></div>
                      <span className="font-bold text-slate-700">{s.cnName || s.name}</span>
                    </div>
                    <div className="text-xs font-bold px-2 py-1 bg-white rounded border border-slate-200">TOP {s.rank}</div>
                  </div>
                ))}

                {selectedBenchmarks.length === 0 && (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                    <Target className="mx-auto mb-2 opacity-50" />
                    请点击右上角“选择对标高校”添加对比对象
                  </div>
                )}
              </div>

              {/* Right: Chart */}
              <div className="lg:col-span-2 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dynamicBenchmarkData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={radarDomain} tick={false} axisLine={false} />
                    {/* ESI Threshold Reference Line */}
                    <Radar
                      name={radarMetric === 'citations' ? 'ESI入围门槛' : 'ESI末位均值'}
                      dataKey="ESI门槛"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="none"
                      dot={false}
                    />
                    <Radar name="本校" dataKey="MyUni" stroke="#2563eb" strokeWidth={3} fill="#3b82f6" fillOpacity={0.15} />
                    {selectedBenchmarks.map((s, i) => (
                      <Radar
                        key={s.rank}
                        name={s.cnName || s.name}
                        dataKey={s.cnName || s.name}
                        stroke={['#10b981', '#f59e0b', '#ef4444'][i]}
                        strokeWidth={2}
                        fill={['#10b981', '#f59e0b', '#ef4444'][i]}
                        fillOpacity={0.05}
                      />
                    ))}
                    <RechartsTooltip
                      wrapperStyle={{ zIndex: 100, pointerEvents: 'none' }}
                      content={({ active, payload, label, coordinate }) => {
                        if (!active || !payload || payload.length === 0) return null;

                        const subject = payload[0]?.payload?.subject || label;
                        const fullSubject = payload[0]?.payload?.fullSubject;
                        const formatVal = (v) => radarMetric === 'cpp' ? Number(v).toFixed(2) : Math.round(Number(v)).toLocaleString();

                        // Calculate position based on subject angle
                        const subjectIndex = dynamicBenchmarkData.findIndex(d => d.subject === subject || d.fullSubject === fullSubject);
                        const totalSubjects = dynamicBenchmarkData.length;
                        // Radar starts from top (270deg) and goes clockwise
                        const anglePerSubject = 360 / totalSubjects;
                        const angleDeg = 270 + (subjectIndex * anglePerSubject);
                        const angleRad = (angleDeg * Math.PI) / 180;

                        // Calculate offset direction (outward from center)
                        const offsetDistance = 180; // pixels from center
                        const offsetX = Math.cos(angleRad) * offsetDistance;
                        const offsetY = Math.sin(angleRad) * offsetDistance;

                        // Determine which quadrant for alignment
                        const isLeft = offsetX < 0;
                        const isTop = offsetY < 0;

                        // Build items with values for sorting
                        // Build items with values for sorting
                        const items = payload.map(entry => {
                          let key = entry.name;
                          if (key === "本校") key = "MyUni";
                          if (key === (radarMetric === 'citations' ? 'ESI入围门槛' : 'ESI末位均值')) key = "ESI门槛";

                          const rawKey = `${key}_Raw`;
                          const esiKey = `${key}_ESI`;
                          const incitesVal = entry.payload[rawKey];
                          const esiVal = entry.payload[esiKey];

                          // Special handling for ESI Threshold: show in ESI column
                          const isThreshold = key === "ESI门槛";
                          const finalEsiVal = isThreshold ? incitesVal : (esiVal !== undefined && esiVal > 0 ? esiVal : undefined);
                          const finalIncitesVal = isThreshold ? undefined : incitesVal;

                          return {
                            name: entry.name,
                            color: entry.color,
                            value: incitesVal || entry.value || 0,
                            esiVal: finalEsiVal !== undefined ? formatVal(finalEsiVal) : '-',
                            incitesVal: finalIncitesVal !== undefined ? formatVal(finalIncitesVal) : '-'
                          };
                        });

                        // Sort by value descending
                        items.sort((a, b) => b.value - a.value);

                        // Calculate tooltip position style
                        const tooltipStyle = {
                          position: 'absolute',
                          transform: `translate(${isLeft ? '-100%' : '0'}, ${isTop ? '-100%' : '0'})`,
                          left: coordinate?.x ? coordinate.x + offsetX * 0.3 : 'auto',
                          top: coordinate?.y ? coordinate.y + offsetY * 0.3 : 'auto'
                        };

                        return (
                          <div
                            className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-100 p-3"
                            style={{ ...tooltipStyle, minWidth: '320px', whiteSpace: 'nowrap' }}
                          >
                            <div className="font-bold text-slate-700 text-sm mb-2 pb-2 border-b border-slate-100">{subject}</div>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-slate-400">
                                  <th className="text-left font-medium pb-1">机构</th>
                                  <th className="text-right font-medium pb-1 pl-3">ESI</th>
                                  <th className="text-right font-medium pb-1 pl-3">InCites</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, i) => (
                                  <tr key={i} className="border-t border-slate-50">
                                    <td className="py-1 pr-2">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-slate-600">{item.name}</span>
                                      </div>
                                    </td>
                                    <td className="text-right text-slate-800 font-medium tabular-nums pl-3">{item.esiVal}</td>
                                    <td className="text-right text-slate-800 font-medium tabular-nums pl-3">{item.incitesVal}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <SubjectSelectModal
              isOpen={radarModalOpen}
              onClose={() => setRadarModalOpen(false)}
              selected={radarSubjects}
              onSelect={setRadarSubjects}
            />


          </div>

          {/* Main Analysis Area (Tabs) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
            <div className="flex border-b border-slate-100 px-6">
              {[
                { id: 'output', label: '科研产出 Output' },
                { id: 'citations', label: '影响力趋势 Impact' },
                { id: 'quality', label: '质量分析 Quality' },
                { id: 'authors', label: '学者贡献 Authors' },
                { id: 'contribution', label: '学院贡献 Colleges' },

                { id: 'journals', label: '发文期刊 Journals' },
                { id: 'cooperation', label: '国际合作 Cooperation' },
                { id: 'institutions', label: '合作机构 Institutions' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "py-4 px-4 text-sm font-bold border-b-2 transition-colors",
                    activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'output' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  {/* 历年发文趋势 */}
                  <div>
                    <h3 className="font-bold text-slate-700 mb-4">全校发文趋势 (Publication Trend)</h3>
                    <div className="h-[350px] w-full bg-slate-50 rounded-xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={realData.overview.publicationTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                          <Bar dataKey="papers" name="发文量" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 22学科产出柱状图 */}
                  <div>
                    <h3 className="font-bold text-slate-700 mb-4">各学科产出分布 (Discipline Output - InCites 2015-2025)</h3>
                    <div className="h-[600px] w-full bg-slate-50 rounded-xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={realData.disciplines.slice().sort((a, b) => b.papers - a.papers)}
                          layout="vertical"
                          margin={{ left: 20, right: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis
                            dataKey="cnName"
                            type="category"
                            width={100}
                            tick={{ fontSize: 11 }}
                          />
                          <RechartsTooltip
                            cursor={{ fill: '#f1f5f9' }}
                            formatter={(value, name, props) => {
                              const d = props.payload;
                              return [
                                `${value.toLocaleString()} 篇`,
                                d.isTop1 ? `${d.cnName} (ESI TOP 1%)` : d.cnName
                              ];
                            }}
                          />
                          <Bar
                            dataKey="papers"
                            name="InCites发文量"
                            radius={[0, 4, 4, 0]}
                            barSize={18}
                          >
                            {realData.disciplines.slice().sort((a, b) => b.papers - a.papers).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.isTop1 ? '#10b981' : '#3b82f6'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded"></div> ESI TOP 1% 学科</span>
                      <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded"></div> 未入围学科</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'citations' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  {/* 历年被引趋势 */}
                  <div>
                    <h3 className="font-bold text-slate-700 mb-4">全校被引频次趋势 (Citation Trend)</h3>
                    <div className="h-[350px] w-full bg-slate-50 rounded-xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={realData.overview.publicationTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                          <Bar dataKey="citations" name="被引频次" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 22学科被引频次柱状图 */}
                  <div>
                    <h3 className="font-bold text-slate-700 mb-4">各学科被引频次分布 (Discipline Citations - InCites 2015-2025)</h3>
                    <div className="h-[600px] w-full bg-slate-50 rounded-xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={realData.disciplines.slice().sort((a, b) => b.citations - a.citations)}
                          layout="vertical"
                          margin={{ left: 20, right: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis
                            dataKey="cnName"
                            type="category"
                            width={100}
                            tick={{ fontSize: 11 }}
                          />
                          <RechartsTooltip
                            cursor={{ fill: '#f1f5f9' }}
                            formatter={(value, name, props) => {
                              const d = props.payload;
                              return [
                                `${value.toLocaleString()} 次`,
                                d.isTop1 ? `${d.cnName} (ESI TOP 1%)` : d.cnName
                              ];
                            }}
                          />
                          <Bar
                            dataKey="citations"
                            name="InCites被引频次"
                            radius={[0, 4, 4, 0]}
                            barSize={18}
                          >
                            {realData.disciplines.slice().sort((a, b) => b.citations - a.citations).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.isTop1 ? '#10b981' : '#8b5cf6'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded"></div> ESI TOP 1% 学科</span>
                      <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-violet-500 rounded"></div> 未入围学科</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'quality' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  {/* 历年质量趋势 */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-700">篇均被引 (CPP) 与 CNCI 综合分析</h3>
                      <div className="text-xs text-slate-500 flex gap-4">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-sm"></div> 本校 CPP</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-400 rounded-sm"></div> 全球基准 CPP</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> CNCI</span>
                      </div>
                    </div>
                    <div className="h-[350px] w-full bg-slate-50 rounded-xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={realData.overview.publicationTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="year" />
                          <YAxis yAxisId="left" label={{ value: 'CPP', angle: -90, position: 'insideLeft' }} />
                          <YAxis yAxisId="right" orientation="right" label={{ value: 'CNCI', angle: 90, position: 'insideRight' }} />
                          <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="cpp" name="本校 CPP" fill="#3b82f6" barSize={20} />
                          <Bar yAxisId="left" dataKey="baselineCpp" name="全球基准 CPP" fill="#94a3b8" barSize={20} />
                          <Line yAxisId="right" type="monotone" dataKey="cnci" name="CNCI" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 22学科质量分析：本校CPP vs 全球基准CPP + CNCI */}
                  <div>
                    <h3 className="font-bold text-slate-700 mb-4">各学科质量分析 (Discipline Quality - InCites 2015-2025)</h3>
                    <div className="h-[450px] w-full bg-slate-50 rounded-xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={realData.disciplines.slice().sort((a, b) => parseFloat(a.citationsPerPaper) - parseFloat(b.citationsPerPaper))}
                          margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="cnName"
                            tick={{ fontSize: 9, angle: -45, textAnchor: 'end' }}
                            height={70}
                            interval={0}
                          />
                          <YAxis yAxisId="cpp" orientation="left" label={{ value: 'CPP', angle: -90, position: 'insideLeft' }} />
                          <YAxis yAxisId="cnci" orientation="right" domain={[0, 'auto']} label={{ value: 'CNCI', angle: 90, position: 'insideRight' }} />
                          <RechartsTooltip
                            cursor={{ fill: '#f1f5f9' }}
                            formatter={(value, name) => {
                              if (value === null || value === undefined) return ['-', name];
                              if (name === 'CNCI') return [Number(value).toFixed(2), name];
                              return [`${Number(value).toFixed(1)}`, name];
                            }}
                          />
                          <Legend verticalAlign="top" height={30} />
                          <Bar
                            yAxisId="cpp"
                            dataKey="citationsPerPaper"
                            name="本校 CPP"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            barSize={12}
                          />
                          <Bar
                            yAxisId="cpp"
                            dataKey="baselineCpp"
                            name="全球基准 CPP"
                            fill="#94a3b8"
                            radius={[4, 4, 0, 0]}
                            barSize={12}
                          />
                          <Line
                            yAxisId="cnci"
                            type="monotone"
                            dataKey="cnci"
                            name="CNCI"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ r: 4, fill: '#f59e0b' }}
                            connectNulls={true}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contribution' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-bold text-slate-700 mb-4">学院贡献分析 College Analysis</h3>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-600 mb-4">发文量 (Papers)</h4>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={collegeStats.slice(0, 15)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                            <RechartsTooltip />
                            <Bar dataKey="papers" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-600 mb-4">被引频次 (Citations)</h4>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={collegeStats.slice(0, 15).sort((a, b) => b.citations - a.citations)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                            <RechartsTooltip />
                            <Bar dataKey="citations" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold cursor-pointer">
                        <tr>
                          <th className="px-6 py-4">学院名称 (College)</th>
                          <th className={`px-6 py-4 text-right hover:bg-slate-100 transition-colors ${collegeSortConfig.key === 'papers' ? 'text-blue-600 bg-blue-50' : ''}`} onClick={() => handleCollegeSort('papers')}>
                            论文数 {collegeSortConfig.key === 'papers' && (collegeSortConfig.direction === 'desc' ? '↓' : '↑')}
                          </th>
                          <th className={`px-6 py-4 text-right hover:bg-slate-100 transition-colors ${collegeSortConfig.key === 'citations' ? 'text-blue-600 bg-blue-50' : ''}`} onClick={() => handleCollegeSort('citations')}>
                            被引频次 {collegeSortConfig.key === 'citations' && (collegeSortConfig.direction === 'desc' ? '↓' : '↑')}
                          </th>
                          <th className={`px-6 py-4 text-right hover:bg-slate-100 transition-colors ${collegeSortConfig.key === 'cpp' ? 'text-blue-600 bg-blue-50' : ''}`} onClick={() => handleCollegeSort('cpp')}>
                            篇均被引 {collegeSortConfig.key === 'cpp' && (collegeSortConfig.direction === 'desc' ? '↓' : '↑')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedColleges.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                            <td className={`px-6 py-4 text-right tabular-nums font-medium ${collegeSortConfig.key === 'papers' ? 'text-blue-600' : 'text-slate-600'}`}>{c.papers}</td>
                            <td className={`px-6 py-4 text-right tabular-nums font-medium ${collegeSortConfig.key === 'citations' ? 'text-blue-600' : 'text-slate-600'}`}>{c.citations}</td>
                            <td className={`px-6 py-4 text-right tabular-nums font-medium ${collegeSortConfig.key === 'cpp' ? 'text-blue-600' : 'text-slate-600'}`}>{c.cpp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'authors' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-bold text-slate-700 mb-4">核心贡献作者 Top 20</h3>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold">
                        <tr>
                          <th className="px-4 py-3">姓名</th>
                          <th className="px-4 py-3">部门</th>
                          {[
                            { key: 'papers', label: '论文' },
                            { key: 'citations', label: '被引' },
                            { key: 'cpp', label: '篇均' },
                            { key: 'contribution', label: '贡献率' }
                          ].map(col => (
                            <th
                              key={col.key}
                              className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                              onClick={() => handleAuthorSort(col.key)}
                            >
                              <div className="flex items-center justify-end gap-1">
                                {col.label}
                                <ArrowUp
                                  size={14}
                                  className={cn(
                                    "transition-transform duration-200",
                                    authorSortConfig.key === col.key && authorSortConfig.direction === 'asc' ? "rotate-0 text-blue-600" : "rotate-180 text-slate-300",
                                    authorSortConfig.key === col.key ? "opacity-100" : "opacity-50"
                                  )}
                                />
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedAuthors.length > 0 ? (
                          sortedAuthors.map((a, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-800">{a.name}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{a.dept}</td>
                              <td className="px-4 py-3 text-right tabular-nums">{a.papers}</td>
                              <td className="px-4 py-3 text-right tabular-nums">{a.citations}</td>
                              <td className="px-4 py-3 text-right tabular-nums">{a.cpp}</td>
                              <td className="px-4 py-3 text-right tabular-nums text-blue-600 font-bold">{a.contribution}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400">暂无作者数据 (No Data)</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Journal Tab */}
              {activeTab === 'journals' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <JournalAnalysisSection />
                </div>
              )}

              {/* Cooperation Tab */}
              {activeTab === 'cooperation' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-bold text-slate-700 mb-4">全球合作网络 - 国际化水平 (International Cooperation)</h3>
                  <CooperationMap />
                </div>
              )}

              {/* Institutions Tab */}
              {activeTab === 'institutions' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-bold text-slate-700 mb-4">合作机构多维分析 (Partner Institution Analysis)</h3>
                  <CollaborationInstitutionView />
                </div>
              )}
            </div>
          </div>


          <div className="flex flex-col gap-8">
            {/* Advantage Disciplines */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm w-full">
              <div className="flex items-center gap-2 mb-6">
                <Award className="text-emerald-500" />
                <h3 className="text-xl font-bold text-slate-800">ESI 前1% 优势学科</h3>
              </div>
              <div className="flex flex-col gap-4">
                {realData.disciplines.filter(d => d.isTop1).map((d) => (
                  <div
                    key={d.name}
                    onClick={() => handleDisciplineClick(d)}
                    className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800 line-clamp-1">{d.cnName}</h4>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Top 1%</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">{d.name}</div>
                    <div className="flex justify-between text-sm">
                      <div className="text-slate-600">Rank: <span className="font-bold text-slate-900">#{d.rank}</span></div>
                      <div className="text-emerald-600 font-bold">{d.percentile}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Potential Disciplines */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm w-full">
              <div className="flex items-center gap-2 mb-6">
                <Target className="text-amber-500" />
                <h3 className="text-xl font-bold text-slate-800">潜力学科监测</h3>
              </div>
              <div className="space-y-3">
                {(() => {
                  const allPotentials = realData.disciplines.filter(d => !d.isTop1 && d.citations > 0);
                  const highPotentials = allPotentials.filter(d => parseFloat(d.potentialValue) > 50);

                  const visibleList = showAllPotential ? allPotentials : highPotentials;
                  const hasMore = allPotentials.length > highPotentials.length;

                  if (visibleList.length === 0) {
                    if (!showAllPotential && allPotentials.length > 0) {
                      return (
                        <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                          暂无潜力值超过 50% 的学科
                          <button onClick={() => setShowAllPotential(true)} className="text-blue-500 hover:underline ml-2">查看全部监测学科</button>
                        </div>
                      );
                    }
                    return <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">暂无潜力学科监测数据</div>;
                  }

                  return (
                    <>
                      {visibleList.map((d) => (
                        <div
                          key={d.name}
                          onClick={() => handleDisciplineClick(d)}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                          <div>
                            <div className="font-bold text-slate-700">{d.cnName}</div>
                            <div className="text-xs text-slate-400">{d.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-400">潜力值</div>
                            <div className="text-amber-500 font-bold">{d.potentialValue}%</div>
                          </div>
                        </div>
                      ))}

                      {/* Show More / Less Toggle */}
                      {hasMore && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => setShowAllPotential(!showAllPotential)}
                            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center gap-1 mx-auto"
                          >
                            {showAllPotential ? (
                              <>收起 (Show Less) <ChevronUp size={16} /></>
                            ) : (
                              <>查看全部监测学科 (Show More) <ChevronDown size={16} /></>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Top Papers Section (Restored) */}
            <div className="bg-indigo-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <FileText size={100} />
              </div>
              <h3 className="text-xl font-bold mb-4 relative z-10 flex items-center gap-2">
                <Award className="text-amber-400" /> 本期高被引论文推荐
              </h3>
              <div className="space-y-4 relative z-10">
                {Array.isArray(realData.topPapers) && realData.topPapers.map((paper, i) => (
                  <div key={i} className="flex gap-3 items-start border-b border-white/10 pb-3 last:border-0 last:pb-0">
                    <div className="bg-indigo-700/50 p-2 rounded text-xs font-bold w-12 text-center flex-shrink-0">
                      Top {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight mb-1 line-clamp-2" title={paper.title}>
                        {paper.title}
                      </p>
                      <div className="flex justify-between items-center text-xs text-indigo-200">
                        <span>{paper.journal}, {paper.year}</span>
                        <span className="flex items-center gap-1"><Users size={10} /> {paper.citations} Cited</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                查看完整清单
              </button>
            </div>
          </div>

        </div >

        {/* Modals (Only Benchmarking and Ranking remain) */}
        < AnimatePresence >
          <BenchmarkModal
            isOpen={benchmarkModalOpen}
            onClose={() => setBenchmarkModalOpen(false)}
            lookup={benchmarkLookup}
            selected={selectedBenchmarks}
            onSelect={setSelectedBenchmarks}
            cnMap={cnMap}
          />
          {
            rankingModalOpen && (
              <RankingListModal
                rankings={rankings}
                currentName={realData.overview.institutionName}
                onClose={() => setRankingModalOpen(false)}
              />
            )
          }
          {
            showTopPaperModal && (
              <TopPaperListModal onClose={() => setShowTopPaperModal(false)} />
            )
          }
        </AnimatePresence >

      </main >
    </div >
  );
}


export default Dashboard;
