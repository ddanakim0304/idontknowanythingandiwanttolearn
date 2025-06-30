import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, ExternalLink, Loader2, AlertCircle, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, MessageCircle, ThumbsUp } from 'lucide-react';
import { getRichRedditContextForTopic } from '../services/redditService';
import { generateLearningInsights } from '../services/insightsService';
import type { LearningInsights, ProgressUpdate } from '../types';

const InsightsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for API data
  const [insightsData, setInsightsData] = useState<LearningInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressUpdate>({ message: '', percentage: 0 });

  const query = searchParams.get('q') || '';

  useEffect(() => {
    setSearchQuery(query);
    if (query) {
      fetchInsights(query);
    }
  }, [query]);

  const fetchInsights = async (topic: string) => {
    setLoading(true);
    setError(null);
    setInsightsData(null);
    
    try {
      // Step 1: Get Reddit context
      setProgress({ message: 'Gathering learning insights from Reddit communities...', percentage: 0 });
      const redditContext = await getRichRedditContextForTopic(topic, setProgress);
      
      if (!redditContext) {
        throw new Error('No relevant Reddit discussions found for this topic. Try a different search term.');
      }

      // Step 2: Generate insights
      setProgress({ message: '🧠 AI is analyzing discussions and extracting learning insights...', percentage: 90 });
      const insights = await generateLearningInsights(topic, redditContext);
      
      setInsightsData(insights);
      setProgress({ message: '✅ Your learning insights are ready!', percentage: 100 });
      
    } catch (err) {
      console.error('Error fetching learning insights:', err);
      setError(err instanceof Error ? err.message : 'Could not generate learning insights – please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/insights?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Video': return '🎥';
      case 'Article': return '📄';
      case 'Course': return '🎓';
      case 'Tool': return '🛠️';
      case 'Community': return '👥';
      default: return '📚';
    }
  };

  const getResourceButtonText = (url: string) => {
    if (url.includes('youtube.com')) {
      return 'Search YouTube';
    } else if (url.includes('google.com')) {
      return 'Search Google';
    }
    return 'Find Resource';
  };

  // Loading component with progress
  const LoadingState = () => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Loader2 size={48} className="animate-spin text-primary-blue mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Analyzing Learning Discussions</h3>
          <p className="text-gray-600 mb-4">{progress.message}</p>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-primary-blue h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-500">
          Extracting the best learning advice and insights from community discussions...
        </p>
      </div>
    </div>
  );

  // Error component
  const ErrorMessage = () => (
    <div className="bg-red-50 border-l-4 border-red-400 rounded-custom p-6 mb-8">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-600 mt-1" size={20} />
        <div>
          <p className="text-red-700 font-medium">Oops! Something went wrong</p>
          <p className="text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => fetchInsights(query)}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-warm-bg">
      {/* Sticky Search Header */}
      <header className="bg-white shadow-gentle sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-600 hover:text-primary-blue transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Change topic…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 rounded-custom border-2 border-gray-200 focus:border-primary-blue focus:outline-none transition-all duration-200"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-primary-blue hover:text-primary-blue-hover transition-colors"
              >
                <Search size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Learning Insights: <span className="text-primary-blue">{query}</span>
          </h1>
          {loading && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 size={16} className="animate-spin" />
              <span>Analyzing Reddit discussions for learning insights...</span>
            </div>
          )}
          {!loading && !error && insightsData && (
            <p className="text-gray-600">Essential learning insights and advice from Reddit communities 🎯</p>
          )}
        </div>

        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Error State */}
        {error && <ErrorMessage />}

        {/* Success State */}
        {!loading && !error && insightsData && (
          <>
            {/* Main Summary */}
            <div className="bg-gradient-to-r from-primary-blue-light to-white rounded-custom p-6 mb-8 shadow-gentle">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-primary-blue text-white rounded-lg">
                  💡
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Learning Summary</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">{insightsData.summary}</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Key Learning Points */}
              <div className="bg-white rounded-custom p-6 shadow-gentle">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-green-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-800">Key Learning Points</h3>
                </div>
                <ul className="space-y-3">
                  {insightsData.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common Learning Mistakes */}
              <div className="bg-white rounded-custom p-6 shadow-gentle">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="text-orange-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-800">Common Learning Mistakes</h3>
                </div>
                <ul className="space-y-3">
                  {insightsData.commonMistakes.map((mistake, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                        !
                      </span>
                      <span className="text-gray-700">{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended Learning Resources */}
            <div className="bg-white rounded-custom p-6 mb-8 shadow-gentle">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="text-purple-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">Recommended Learning Resources</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {insightsData.recommendedResources.map((resource, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-primary-blue-light transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-medium text-gray-800">{resource.title}</h4>
                      <span className="text-lg">{getTypeIcon(resource.type)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors text-sm font-medium"
                    >
                      {getResourceButtonText(resource.url)}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Learning Steps */}
            <div className="bg-white rounded-custom p-6 mb-8 shadow-gentle">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">Next Learning Steps</h3>
              </div>
              <div className="space-y-3">
                {insightsData.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources */}
            <div className="bg-white rounded-custom p-6 mb-8 shadow-gentle">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="text-gray-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">Sources</h3>
              </div>
              <div className="space-y-3">
                {insightsData.sources.map((source, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-primary-blue-light transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">{source.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                          <span className="font-medium">{source.subreddit}</span>
                          <div className="flex items-center gap-1">
                            <ThumbsUp size={12} />
                            <span>{source.upvotes}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{source.summary}</p>
                      </div>
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      View Discussion
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Switch to Study Plan CTA */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-custom p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Ready for a structured approach?</h3>
                  <p className="text-gray-600">Get a detailed week-by-week study plan with progress tracking</p>
                </div>
                <button
                  onClick={() => navigate(`/results?q=${encodeURIComponent(query)}`)}
                  className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors font-medium"
                >
                  Create Study Plan
                </button>
              </div>
            </div>
          </>
        )}

        {/* Back Link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-primary-blue hover:text-primary-blue-hover transition-colors font-medium"
          >
            <ArrowLeft size={16} />
            Start a new search
          </button>
        </div>
      </main>
    </div>
  );
};

export default InsightsPage;