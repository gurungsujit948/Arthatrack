import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProfileSettings from './ProfileSettings';
import Categories from './Categories';

const SettingsPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ProfileSettings />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="*" element={<Navigate to="/settings" replace />} />
    </Routes>
  );
};

export default SettingsPage;