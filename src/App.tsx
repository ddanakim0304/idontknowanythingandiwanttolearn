import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ResultsPage from './components/ResultsPage';

function App() {
  return (
    <div className="min-h-screen bg-warm-bg font-sans">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;