import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DiagnosticTest from './pages/DiagnosticTest';
import TrainingSession from './pages/TrainingSession';
import Analytics from './pages/Analytics';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import { createInitialStudentModel } from './logic/studentModel';
import './index.css';

function App() {
  const [student, setStudent] = useState(() => {
    const saved = localStorage.getItem('skillup_student');
    return saved ? JSON.parse(saved) : createInitialStudentModel();
  });

  useEffect(() => {
    localStorage.setItem('skillup_student', JSON.stringify(student));
  }, [student]);

  return (
    <div className="dark">
      <div className="app-container">
        <Routes>
          <Route path="/" element={
            student.level === "Belum Dinilai" ? 
            <Navigate to="/diagnostic" /> : 
            <Navigate to="/dashboard" />
          } />
          <Route path="/dashboard" element={<Dashboard student={student} />} />
          <Route path="/analytics" element={<Analytics student={student} />} />
          <Route path="/achievements" element={<Achievements student={student} />} />
          <Route path="/settings" element={<Settings student={student} setStudent={setStudent} />} />
          <Route path="/profile" element={<Profile student={student} />} />
          <Route path="/diagnostic" element={<DiagnosticTest student={student} setStudent={setStudent} />} />
          <Route path="/training/:id" element={<TrainingSession student={student} setStudent={setStudent} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
