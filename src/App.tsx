import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ResultsPage from './components/ResultsPage';
import InsightsPage from './components/InsightsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;