import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import NewResultsPage from './components/NewResultsPage';

function App() {
  return (
    <div className="min-h-screen bg-warm-bg font-sans">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/results" element={<NewResultsPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;