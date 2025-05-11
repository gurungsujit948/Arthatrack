import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BudgetList from './BudgetList';
import BudgetForm from './BudgetForm';

const BudgetsPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<BudgetList />} />
      <Route path="/new" element={<BudgetForm />} />
      <Route path="/:id/edit" element={<BudgetForm />} />
      <Route path="*" element={<Navigate to="/budgets" replace />} />
    </Routes>
  );
};

export default BudgetsPage;