
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DisciplineDetail from './pages/DisciplineDetail';
import DebugPage from './pages/DebugPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 默认跳转到西南民大 (xnmz) */}
        <Route path="/" element={<Navigate to="/report/xnmz" replace />} />

        {/* 核心路由: /report/学校ID */}
        <Route path="/report/:schoolId" element={<Dashboard />} />
        <Route path="/debug" element={<DebugPage />} />

        {/* Dynamic route for Discipline details */}
        <Route path="/report/:schoolId/discipline/:disciplineName" element={<DisciplineDetail />} />

        {/* 404 处理 */}
        <Route path="*" element={
          <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">404</h1>
              <p className="text-slate-500">Page not found</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
