import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MonthlyReport from './MonthlyReport';

const ReportsPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MonthlyReport />} />
      <Route path="*" element={<Navigate to="/reports" replace />} />
    </Routes>
  );
};

export default ReportsPage;