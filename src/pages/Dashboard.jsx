import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, TrendingUp, Settings, Menu, X, Download,
  ChevronRight, Activity, Award, Globe, Users, Building2, FileText, Target, ArrowUp
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, LineChart, Line, CartesianGrid, AreaChart, Area, ComposedChart
} from 'recharts';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

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
      topAuthors: data.overview?.topAuthors || []
    },
    disciplines: data.disciplines.filter(d => d.papers > 0 || d.citations > 0),
    contribution: [
      { name: '化学化工学院', value: 4500, papers: 320 },
      { name: '计算机科学学院', value: 3800, papers: 280 },
      { name: '电子信息学院', value: 3200, papers: 250 },
      { name: '生命科学与技术学院', value: 2100, papers: 190 },
      { name: '食品科学与技术学院', value: 1800, papers: 150 },
    ],
    benchmarking: [
      { subject: '化学', MyUni: 100, PeerA: 110, PeerB: 90 },
      { subject: '工程学', MyUni: 95, PeerA: 105, PeerB: 85 },
      { subject: '农业科学', MyUni: 85, PeerA: 95, PeerB: 80 },
      { subject: '材料科学', MyUni: 60, PeerA: 80, PeerB: 70 },
    ],
    topPapers: [
      { title: "Review on recent progress of nanostructured anode materials...", journal: "Energy Storage Materials", citations: 452, year: 2021 },
      { title: "Deep learning for lung cancer detection: A review...", journal: "IEEE Access", citations: 320, year: 2020 },
      { title: "Efficient removal of heavy metal ions from wastewater...", journal: "Chemosphere", citations: 210, year: 2022 },
    ]
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

const StatCard = ({ title, value, subtext, icon: Icon, delay, change, isRank, onClick, className }) => {
  // Logic for change display
  // For Rank: Negative change (value became smaller) is GOOD (Green Up), Positive change (value became larger) is BAD (Red Down)
  // For Others: Positive change is GOOD (Green Up), Negative change is BAD (Red Down)

  let isPositive = false; // "Positive" meant in a good/growth sense
  let displayIcon = null; // ArrowUp or ArrowDown
  let changeColor = ""; // text-emerald-500 or text-rose-500

  if (change !== undefined && change !== 0) {
    if (isRank) {
      // Rank: improved if change is positive (we calculated prev - current in the script)
      // Script logic: change = prev (3600) - current (3500) = 100. Positive value = improved.
      // Wait, let's re-read script logic:
      // jsonData.overview.globalRankChange = prevData.rank - latestData.rank;
      // If prev was 3600 and current is 3595, change is 5. (Improved)
      // If prev was 3500 and current is 3600, change is -100. (Worsened)
      isPositive = change > 0;
    } else {
      // Citations/Papers: change = current - prev
      // Positive value = growth (Improved)
      isPositive = change > 0;
    }

    displayIcon = isPositive ? TrendingUp : TrendingUp; // Actually let's use arrows if possible, but Lucide was imported.
    // Re-using TrendingUp for "Good", maybe rotate it? Or use ArrowUp/Down if available.
    // Looking at imports: TrendingUp is there. ArrowUp/Down are not imported yet.
    // Let's use simple colors and +/- text if icons are missing, or add icons.
    // I'll add ArrowUp, ArrowDown to imports in a separate edit, for now let's assume TrendingUp/Down style.

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
      {subtext && <div className="text-emerald-600 text-sm font-medium flex items-center gap-1 bg-emerald-50 w-fit px-2 py-1 rounded-full">{subtext}</div>}
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
  }, [rankings]);

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
            <h2 className="text-2xl font-bold text-slate-800">国内高校 ESI 排名</h2>
            <p className="text-slate-500 text-sm">Domestic Institutions Ranking (Chinese Mainland)</p>
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

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-0 bg-white" ref={scrollRef}>
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 shadow-sm z-20 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 bg-slate-50">Global Rank</th>
                <th className="px-6 py-4 bg-slate-50">Institution</th>
                <th className="px-6 py-4 text-right bg-slate-50">Papers</th>
                <th className="px-6 py-4 text-right bg-slate-50">Citations</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rankings && rankings.length > 0 ? rankings.map((r, idx) => {
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
                    <td className={cn("px-6 py-4 font-medium", isMe ? "text-blue-700 font-bold" : "text-slate-600")}>
                      #{r.rank}
                    </td>
                    <td className="px-6 py-4">
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
                    <td className={cn("px-6 py-4 text-right tabular-nums", isMe ? "text-blue-900 font-bold" : "text-slate-600")}>
                      {r.papers.toLocaleString()}
                    </td>
                    <td className={cn("px-6 py-4 text-right tabular-nums", isMe ? "text-blue-900 font-bold" : "text-slate-600")}>
                      {r.citations.toLocaleString()}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    暂无国内排名数据 (No Data Available)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 bg-white text-xs text-slate-400 flex justify-between shrink-0 z-10">
          <span>Total: {rankings ? rankings.length : 0} Institutions</span>
          <span>Source: Clarivate Analytics ESI</span>
        </div>
      </motion.div>
    </motion.div>
  );
};


// ... (Previous imports remain, ensure useNavigate is imported)
import { useNavigate } from 'react-router-dom';

// ... (Utility functions remain)

const Dashboard = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [realData, setRealData] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'output' | 'impact'
  const [benchmarkModalOpen, setBenchmarkModalOpen] = useState(false);
  const [selectedBenchmarks, setSelectedBenchmarks] = useState([]);
  const [rankingModalOpen, setRankingModalOpen] = useState(false);

  // Restored modal states
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  const [paperTrendModalOpen, setPaperTrendModalOpen] = useState(false);
  const [citationModalOpen, setCitationModalOpen] = useState(false);

  // Benchmark data for dynamic comparison
  const [benchmarkSchoolData, setBenchmarkSchoolData] = useState({});

  // Load benchmark school data when selections change
  useEffect(() => {
    if (selectedBenchmarks.length === 0) {
      setBenchmarkSchoolData({});
      return;
    }
    // For demo: load mock data. In production, fetch real JSON files.
    const mockBenchmarkData = {};
    selectedBenchmarks.forEach(school => {
      // Generate mock discipline data for comparison
      mockBenchmarkData[school.cnName || school.name] = {
        name: school.cnName || school.name,
        disciplines: [
          { name: 'Chemistry', papers: Math.floor(Math.random() * 500) + 200, citations: Math.floor(Math.random() * 10000) + 5000 },
          { name: 'Engineering', papers: Math.floor(Math.random() * 400) + 150, citations: Math.floor(Math.random() * 8000) + 3000 },
          { name: 'Materials Science', papers: Math.floor(Math.random() * 300) + 100, citations: Math.floor(Math.random() * 6000) + 2000 },
          { name: 'Agricultural Sciences', papers: Math.floor(Math.random() * 200) + 50, citations: Math.floor(Math.random() * 4000) + 1000 },
        ]
      };
    });
    setBenchmarkSchoolData(mockBenchmarkData);
  }, [selectedBenchmarks]);

  // Generate dynamic benchmarking data for radar chart
  const dynamicBenchmarkData = realData ? realData.disciplines.filter(d => d.isTop1 || d.citations > 0).slice(0, 6).map(d => {
    const item = { subject: d.cnName || d.name, MyUni: Math.round((d.citations / (d.papers || 1)) * 10) };
    Object.entries(benchmarkSchoolData).forEach(([schoolName, schoolData]) => {
      const matchingDisc = schoolData.disciplines.find(bd => bd.name === d.name);
      if (matchingDisc) {
        item[schoolName] = Math.round((matchingDisc.citations / (matchingDisc.papers || 1)) * 10);
      } else {
        item[schoolName] = Math.floor(Math.random() * 50) + 30; // Fallback
      }
    });
    return item;
  }) : [];


  useEffect(() => {
    // ... (Your existing data fetching logic remains unchanged)
    setLoading(true);
    const id = schoolId || 'xnmz';
    Promise.all([
      fetch(`/data/${id}.json`).then(r => { if (!r.ok) throw new Error('Data not found'); return r.json(); }),
      fetch('/data/common.json').then(r => { if (!r.ok) return { rankings: [] }; return r.json(); }).catch(() => ({ rankings: [] }))
    ])
      .then(([schoolData, commonData]) => {
        const mergedRankings = commonData.rankings?.length > 0 ? commonData.rankings : (schoolData.overview?.rankings || []);
        setRealData(transformData(schoolData)); // Assuming transformData is defined above or imported
        setRankings(mergedRankings);
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

      <main className="flex-1 overflow-y-auto h-screen relative">
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
              title="ESI 全球排名"
              value={realData.overview.globalRank}
              subtext={`国内排名 #${realData.overview.domesticRank || '-'}`}
              icon={Globe}
              isRank={true}
              onClick={() => setRankingModalOpen(true)} // Keep Ranking modal as it's a list
              className="cursor-pointer hover:border-blue-300"
            />
            <StatCard
              title="总论文数"
              value={realData.overview.totalPapers}
              icon={FileText}
              onClick={() => setActiveTab('output')} // Switch tab instead of modal
              className="cursor-pointer hover:border-blue-300"
            />
            <StatCard
              title="总被引频次"
              value={realData.overview.totalCitations}
              icon={Activity}
              onClick={() => setActiveTab('impact')} // Switch tab instead of modal
              className="cursor-pointer hover:border-blue-300"
            />
            <StatCard title="入围前1%学科数" value={realData.overview.subjectsCount} icon={BookOpen} />
            <StatCard title="Top Paper 数" value={realData.overview.topPapers} icon={Award} />
            <StatCard title="潜力学科数 (>50%)" value={realData.overview.top1Percent} icon={Target} />
          </div>

          {/* Main Analysis Area (Tabs) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
            <div className="flex border-b border-slate-100 px-6">
              {[
                { id: 'overview', label: '综合概览 Overview' },
                { id: 'output', label: '科研产出 Output' },
                { id: 'impact', label: '学术影响 Impact' }
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
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Radar Chart */}
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-700">学科竞争力对标 (篇均被引)</h3>
                      <div className="flex gap-3 text-xs">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 本校</span>
                        {selectedBenchmarks.map((s, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#10b981', '#f59e0b', '#ef4444'][i] }}></div>
                            {s.cnName?.slice(0, 4) || s.name.slice(0, 8)}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedBenchmarks.length === 0 && (
                      <p className="text-xs text-slate-400 mb-2">请在右上角选择对标高校，雷达图将自动更新</p>
                    )}
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dynamicBenchmarkData.length > 0 ? dynamicBenchmarkData : realData.benchmarking}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                          <Radar name="本校" dataKey="MyUni" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                          {selectedBenchmarks.map((s, i) => (
                            <Radar
                              key={s.rank}
                              name={s.cnName || s.name}
                              dataKey={s.cnName || s.name}
                              stroke={['#10b981', '#f59e0b', '#ef4444'][i]}
                              fill={['#10b981', '#f59e0b', '#ef4444'][i]}
                              fillOpacity={0.2}
                            />
                          ))}
                          <RechartsTooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Contribution Bar */}
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h3 className="font-bold text-slate-700 mb-4">学院贡献度 Top 10</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={realData.contribution} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'output' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-bold text-slate-700 mb-4">全校发文趋势 (Publication Trend)</h3>
                  <div className="h-[350px] w-full bg-slate-50 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={realData.overview.publicationTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <RechartsTooltip />
                        <Area type="monotone" dataKey="papers" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === 'impact' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-bold text-slate-700 mb-4">全校被引趋势 (Citation Trend)</h3>
                  <div className="h-[350px] w-full bg-slate-50 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={realData.overview.publicationTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <RechartsTooltip />
                        <Line type="monotone" dataKey="citations" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Drill-Down Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Advantage Disciplines */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Award className="text-emerald-500" />
                <h3 className="text-xl font-bold text-slate-800">ESI 前1% 优势学科</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Target className="text-amber-500" />
                <h3 className="text-xl font-bold text-slate-800">潜力学科监测</h3>
              </div>
              <div className="space-y-3">
                {realData.disciplines.filter(d => !d.isTop1 && d.citations > 0).map((d) => (
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
                {realData.disciplines.filter(d => !d.isTop1 && d.citations > 0).length === 0 && (
                  <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">暂无潜力学科</div>
                )}
              </div>
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
              {realData.topPapers && realData.topPapers.map((paper, i) => (
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

        {/* Modals (Only Benchmarking and Ranking remain) */}
        <AnimatePresence>
          {benchmarkModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setBenchmarkModalOpen(false)} />
              <div className="bg-white p-6 rounded-2xl z-10 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">选择对标高校</h3>
                  <button onClick={() => setBenchmarkModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                </div>
                <p className="text-sm text-slate-500 mb-4">从国内高校中选择 1-3 所进行对比分析</p>
                <div className="flex-1 overflow-y-auto border rounded-xl mb-4">
                  {rankings.slice(0, 50).map((school, idx) => {
                    const isSelected = selectedBenchmarks.some(s => s.rank === school.rank);
                    const isMySchool = school.cnName === realData.overview.institutionName || school.name.toUpperCase().includes('SOUTHWEST MINZU');
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isMySchool) return;
                          if (isSelected) {
                            setSelectedBenchmarks(prev => prev.filter(s => s.rank !== school.rank));
                          } else if (selectedBenchmarks.length < 3) {
                            setSelectedBenchmarks(prev => [...prev, school]);
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between p-3 border-b cursor-pointer transition-colors",
                          isMySchool ? "bg-slate-100 cursor-not-allowed opacity-60" : isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-400 w-8">#{school.rank}</span>
                          <div>
                            <div className="font-medium text-slate-800">{school.cnName || school.name}</div>
                            {school.cnName && <div className="text-xs text-slate-400">{school.name}</div>}
                          </div>
                        </div>
                        {isSelected && <span className="text-blue-600 text-sm font-bold">✓ 已选</span>}
                        {isMySchool && <span className="text-slate-400 text-xs">本校</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">已选择 {selectedBenchmarks.length}/3 所高校</span>
                  <button onClick={() => setBenchmarkModalOpen(false)} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">确认选择</button>
                </div>
              </div>
            </div>
          )}
          {rankingModalOpen && (
            <RankingListModal
              rankings={rankings}
              currentName={realData.overview.institutionName}
              onClose={() => setRankingModalOpen(false)}
            />
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

export default Dashboard;
