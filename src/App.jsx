import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, TrendingUp, Settings, Menu, X, Download,
  ChevronRight, Activity, Award, Globe, Users, Building2, FileText, Target
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

import data from './data.json';

// --- 数据处理 (Data Processing) ---

// Transform JSON data to match component expectations if necessary, 
// or ensure components use the JSON structure directly.
// The JSON structure is already quite close.
const realData = {
  overview: {
    globalRank: data.overview?.globalRank || 1245,
    subjectsCount: data.overview?.subjectsCount || data.disciplines.filter(d => d.isTop1).length,
    totalCitations: data.overview?.totalCitations || data.disciplines.reduce((acc, d) => acc + (d.citations || 0), 0),
    top1Percent: data.overview?.top1Percent || data.disciplines.filter(d => !d.isTop1 && d.citations > 0 && parseFloat(d.potentialValue) > 50).length,
    institutionName: data.institution,
    totalPapers: data.overview?.totalPapers || data.disciplines.reduce((acc, d) => acc + (d.papers || 0), 0),
    topPapers: data.overview?.topPapers || data.disciplines.reduce((acc, d) => acc + (d.topPapers || 0), 0)
  },
  disciplines: data.disciplines.filter(d => d.papers > 0 || d.citations > 0), // Filter out empty placeholder disciplines
  // Keep mock contribution data for now as Excel didn't provide this specific view
  contribution: [
    { name: '化学化工学院', value: 4500, papers: 320 },
    { name: '计算机科学学院', value: 3800, papers: 280 },
    { name: '电子信息学院', value: 3200, papers: 250 },
    { name: '生命科学与技术学院', value: 2100, papers: 190 },
    { name: '食品科学与技术学院', value: 1800, papers: 150 },
  ],
  // Keep mock benchmarking data
  benchmarking: [
    { subject: '化学', MyUni: 100, PeerA: 110, PeerB: 90 },
    { subject: '工程学', MyUni: 95, PeerA: 105, PeerB: 85 },
    { subject: '农业科学', MyUni: 85, PeerA: 95, PeerB: 80 },
    { subject: '材料科学', MyUni: 60, PeerA: 80, PeerB: 70 },
  ],
  // Keep mock top papers
  topPapers: [
    { title: "Review on recent progress of nanostructured anode materials...", journal: "Energy Storage Materials", citations: 452, year: 2021 },
    { title: "Deep learning for lung cancer detection: A review...", journal: "IEEE Access", citations: 320, year: 2020 },
    { title: "Efficient removal of heavy metal ions from wastewater...", journal: "Chemosphere", citations: 210, year: 2022 },
  ]
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

const StatCard = ({ title, value, subtext, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group"
  >
    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon size={80} className="text-blue-600" />
    </div>
    <div className="text-slate-500 text-sm font-medium mb-2 flex items-center gap-2">
      {title}
    </div>
    <div className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">
      <CountUp value={value} />
    </div>
    {subtext && <div className="text-emerald-600 text-sm font-medium flex items-center gap-1 bg-emerald-50 w-fit px-2 py-1 rounded-full">{subtext}</div>}
  </motion.div>
);

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

import UniversitySelector from './components/UniversitySelector';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  const [selectedBenchmarks, setSelectedBenchmarks] = useState([]);
  const [benchmarkModalOpen, setBenchmarkModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 overflow-y-auto h-screen relative">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white p-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <h1 className="text-lg font-bold text-slate-800">ESI 学科分析</h1>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 pb-24">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <Building2 size={24} />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {realData.overview.institutionName}
                </h2>
              </div>
              <p className="text-slate-500">基于 ESI 数据库 (Clarivate Analytics) 最新统计</p>
            </div>

            <button
              onClick={() => setBenchmarkModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 rounded-lg font-medium transition-all shadow-sm group"
            >
              <Building2 size={18} className="group-hover:scale-110 transition-transform" />
              <span>选择对标高校</span>
              {selectedBenchmarks.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {selectedBenchmarks.length}
                </span>
              )}
            </button>
          </div>

          {/* 顶层数据卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="ESI 全球排名"
              value={realData.overview.globalRank}
              subtext="Global Rank"
              icon={Globe}
              delay={0.1}
            />
            <StatCard
              title="总论文数"
              value={realData.overview.totalPapers}
              subtext="Total Papers"
              icon={FileText}
              delay={0.2}
            />
            <StatCard
              title="总被引频次"
              value={realData.overview.totalCitations}
              subtext="Total Citations"
              icon={Activity}
              delay={0.3}
            />
            <StatCard
              title="入围前1%学科数"
              value={realData.overview.subjectsCount}
              subtext="Top 1% Subjects"
              icon={BookOpen}
              delay={0.4}
            />
            <StatCard
              title="Top Paper 数"
              value={realData.overview.topPapers}
              subtext="Highly Cited Papers"
              icon={Award}
              delay={0.5}
            />
            <StatCard
              title="潜力学科数 (>50%)"
              value={realData.overview.top1Percent}
              subtext="Potential Subjects"
              icon={Target}
              delay={0.6}
            />
          </div>

          {/* 核心分析区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* 左侧：学科表现 & 潜力预测 */}
            <div className="lg:col-span-8 space-y-8">

              {/* 对标分析 (Radar) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">学科竞争力对标 (Benchmarking)</h3>
                  <div className="flex gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1 text-slate-600"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 本校</span>
                    <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded-full bg-slate-300"></div> 对标高校A</span>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={realData.benchmarking}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 120]} tick={false} axisLine={false} />
                      <Radar name="MyUni" dataKey="MyUni" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                      <Radar name="PeerA" dataKey="PeerA" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.3} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 贡献度分析 (Bar) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6">学院贡献度排行 (Top Contribution)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={realData.contribution} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={140} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="value" name="被引频次" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24}>
                        {
                          realData.contribution.map((entry, index) => (
                            <cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#94a3b8'} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 右侧：潜力学科 & 核心论文 */}
            <div className="lg:col-span-4 space-y-8">

              {/* 核心分析区域：分栏布局 */}

              {/* 1. 优势学科板块 (New) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Award className="text-emerald-500" />
                  ESI 前1% 优势学科
                </h3>
                <p className="text-sm text-slate-400 mb-6">Advantage Disciplines (Global Top 1%)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {realData.disciplines.filter(d => d.isTop1).map((d, i) => (
                    <motion.div
                      key={d.name}
                      layoutId={`card-${d.name}`}
                      whileHover={{ scale: 1.02, backgroundColor: '#f0fdf4' }}
                      onClick={() => setSelectedDiscipline(d)}
                      className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 cursor-pointer group hover:border-emerald-300 transition-all relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Award size={60} className="text-emerald-600" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-800 text-lg">{d.cnName}</h4>
                          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold">Top 1%</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">{d.name}</p>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                          <div>
                            <span className="text-slate-400 text-xs block">全球排名</span>
                            <span className="font-bold text-slate-700">#{d.rank}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-xs block">全球百分位</span>
                            <span className="font-bold text-emerald-600">{d.percentile}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-xs block">篇均被引</span>
                            <span className="font-bold text-slate-700">{(d.citations / (d.papers || 1)).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-xs block">Top Paper</span>
                            <span className="font-bold text-amber-600">{d.topPapers || 0} 篇</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 2. 潜力学科预测 (Modified) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Target className="text-amber-500" />
                  潜力学科监测
                </h3>
                <p className="text-sm text-slate-400 mb-6">Potential Disciplines Prediction</p>
                <div>
                  {realData.disciplines.filter(d => !d.isTop1 && d.citations > 0).map((d, i) => (
                    <PredictionCard
                      key={d.name}
                      discipline={d}
                      delay={0.5 + (i * 0.1)}
                      onClick={() => setSelectedDiscipline(d)}
                    />
                  ))}
                  {realData.disciplines.filter(d => !d.isTop1 && d.citations > 0).length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      暂无接近前1%门槛的潜力学科
                    </div>
                  )}
                </div>
              </div>

              {/* 高被引论文精选 */}
              <div className="bg-indigo-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <FileText size={100} />
                </div>
                <h3 className="text-xl font-bold mb-4 relative z-10">本期高被引论文推荐</h3>
                <div className="space-y-4 relative z-10">
                  {realData.topPapers.map((paper, i) => (
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
          </div>
        </div>

        {/* 详情浮层 */}
        <AnimatePresence>
          {selectedDiscipline && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 z-30 backdrop-blur-sm"
                onClick={() => setSelectedDiscipline(null)}
              />
              <DetailPanel
                discipline={selectedDiscipline}
                onClose={() => setSelectedDiscipline(null)}
              />
            </>
          )}
        </AnimatePresence>

      </main>
      {/* 对标高校选择弹窗 */}
      <AnimatePresence>
        {benchmarkModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm"
              onClick={() => setBenchmarkModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full mx-4 pointer-events-auto relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 z-10">
                  <button onClick={() => setBenchmarkModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-1">
                  <UniversitySelector
                    selectedUniversities={selectedBenchmarks}
                    onSelect={setSelectedBenchmarks}
                  />
                </div>
                <div className="flex justify-end p-6 bg-slate-50 border-t border-slate-100 gap-3">
                  <button
                    onClick={() => setBenchmarkModalOpen(false)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
                  >
                    确认选择
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
