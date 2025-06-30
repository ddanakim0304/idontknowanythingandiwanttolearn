import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Dice1, BookOpen, Lightbulb } from 'lucide-react';
import type { SearchMode } from '../types';

const LandingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('study-plan');
  const navigate = useNavigate();

  const exampleTopics = ['Autodesk Maya', 'Korean', 'Python', 'Playing Ukulele', 'Photography'];

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      const route = searchMode === 'study-plan' ? '/results' : '/insights';
      navigate(`${route}?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleTopicClick = (topic: string) => {
    setSearchQuery(topic);
    handleSearch(topic);
  };

  const getRandomTopic = () => {
    const randomTopics = ['Machine Learning', 'Guitar', 'Digital Art', 'Japanese', 'Chess', 'Yoga', 'Pottery', 'JavaScript'];
    const random = randomTopics[Math.floor(Math.random() * randomTopics.length)];
    handleTopicClick(random);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Logo/Title */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 leading-tight">
            🤷‍♂️ I Don't Know Anything<br />
            <span className="text-primary-blue">and I Want to Learn…</span>
          </h1>
        </div>

        {/* Mode Toggle */}
        <div className="mb-8">
          <div className="inline-flex bg-gray-100 rounded-custom p-1 mb-6">
            <button
              onClick={() => setSearchMode('study-plan')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                searchMode === 'study-plan'
                  ? 'bg-white text-primary-blue shadow-gentle'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BookOpen size={16} />
              Study Plan
            </button>
            <button
              onClick={() => setSearchMode('learning-insights')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                searchMode === 'learning-insights'
                  ? 'bg-white text-primary-blue shadow-gentle'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Lightbulb size={16} />
              Learning Insights
            </button>
          </div>

          {/* Mode Description */}
          <div className="mb-6">
            {searchMode === 'study-plan' ? (
              <p className="text-gray-600 text-sm">
                Get a personalized week-by-week learning roadmap with resources and progress tracking
              </p>
            ) : (
              <p className="text-gray-600 text-sm">
                Get key insights, essential advice, and curated learning resources from Reddit communities
              </p>
            )}
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder={
                searchMode === 'study-plan' 
                  ? "I don't know anything and I want to learn…"
                  : "What do you want learning insights about?"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-6 py-4 text-lg rounded-custom shadow-gentle border-2 border-transparent focus:border-primary-blue focus:outline-none transition-all duration-200 bg-white"
            />
            <button
              onClick={() => handleSearch()}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-primary-blue hover:text-primary-blue-hover transition-colors"
            >
              <Search size={24} />
            </button>
          </div>

          {/* Example Topics */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {exampleTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => handleTopicClick(topic)}
                className="px-4 py-2 bg-white rounded-full text-sm text-gray-600 hover:text-primary-blue hover:bg-primary-blue-light transition-all duration-200 shadow-gentle hover:shadow-gentle-hover"
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <p>Hit ⏎ or tap the 🔍 to start exploring!</p>
            <button
              onClick={getRandomTopic}
              className="flex items-center gap-1 text-primary-blue hover:text-primary-blue-hover transition-colors"
            >
              <Dice1 size={16} />
              Random
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;