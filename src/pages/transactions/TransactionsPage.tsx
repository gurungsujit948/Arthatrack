import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TransactionList from './TransactionList';
import TransactionForm from './TransactionForm';
import TransactionDetail from './TransactionDetail';

const TransactionsPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<TransactionList />} />
      <Route path="/new" element={<TransactionForm />} />
      <Route path="/:id" element={<TransactionDetail />} />
      <Route path="/:id/edit" element={<TransactionForm />} />
      <Route path="*" element={<Navigate to="/transactions" replace />} />
    </Routes>
  );
};

export default TransactionsPage;