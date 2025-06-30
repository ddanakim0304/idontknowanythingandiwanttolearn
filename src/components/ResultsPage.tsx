import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, Lightbulb, ExternalLink, Filter, Calendar, Clock, ChevronDown, ChevronRight, CheckCircle2, Circle, Play, BookOpen, MessageCircle, Zap, Loader2, AlertCircle } from 'lucide-react';
import { getRichRedditContextForTopic } from '../services/redditService';
import { generateLearningGuide } from '../services/geminiService';
import type { LearningGuide, ProgressUpdate } from '../types';

const ResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1]);
  const [planDuration, setPlanDuration] = useState(4);
  const [dailyTime, setDailyTime] = useState(1);
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  
  // New state for API data
  const [planData, setPlanData] = useState<LearningGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressUpdate>({ message: '', percentage: 0 });

  const query = searchParams.get('q') || '';

  useEffect(() => {
    setSearchQuery(query);
    if (query) {
      fetchLearningPlan(query);
    }
  }, [query]);

  const fetchLearningPlan = async (topic: string) => {
    setLoading(true);
    setError(null);
    setPlanData(null);
    
    try {
      // Step 1: Get Reddit context
      setProgress({ message: 'Starting search...', percentage: 0 });
      const redditContext = await getRichRedditContextForTopic(topic, setProgress);
      
      if (!redditContext) {
        throw new Error('No relevant Reddit posts found for this topic. Try a different search term.');
      }

      // Step 2: Generate learning guide
      setProgress({ message: '🧠 AI is crafting your personalized learning plan...', percentage: 90 });
      const guide = await generateLearningGuide(topic, planDuration, dailyTime, redditContext);
      
      setPlanData(guide);
      setProgress({ message: '✅ Your learning plan is ready!', percentage: 100 });
      
    } catch (err) {
      console.error('Error fetching learning plan:', err);
      setError(err instanceof Error ? err.message : 'Could not generate plan – please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/results?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const toggleWeek = (week: number) => {
    setExpandedWeeks(prev =>
      prev.includes(week)
        ? prev.filter(w => w !== week)
        : [...prev, week]
    );
  };

  const toggleItemCompletion = (itemId: string) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Video': return <Play size={14} className="text-red-500" />;
      case 'Forum': return <MessageCircle size={14} className="text-blue-500" />;
      case 'Article': return <BookOpen size={14} className="text-green-500" />;
      case 'Practice': return <Zap size={14} className="text-yellow-500" />;
      case 'Tip': return <Lightbulb size={14} className="text-purple-500" />;
      default: return <BookOpen size={14} className="text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Video': return 'bg-red-100 text-red-700';
      case 'Forum': return 'bg-blue-100 text-blue-700';
      case 'Article': return 'bg-green-100 text-green-700';
      case 'Practice': return 'bg-yellow-100 text-yellow-700';
      case 'Tip': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
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

  const filters = [
    { label: 'Last Week', param: 'time=7d' },
    { label: 'Beginner-Friendly', param: 'level=beginner' },
    { label: 'Free Only', param: 'price=free' }
  ];

  const weeklyPlan = planData?.weeklyPlan || [];
  const totalItems = weeklyPlan.reduce((sum, week) => sum + week.steps.length, 0);
  const completedCount = completedItems.size;
  const progressPercentage = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  // Loading component with progress
  const LoadingState = () => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Loader2 size={48} className="animate-spin text-primary-blue mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Generating Your Learning Plan</h3>
          <p className="text-gray-600 mb-4">{progress.message}</p>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-primary-blue h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-500">
          This usually takes 30-60 seconds as we analyze Reddit discussions and craft your personalized plan.
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
            onClick={() => fetchLearningPlan(query)}
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
          <div className="flex items-center gap-4 mb-3">
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

          {/* Time Commitment Summary */}
          {!loading && !error && planData && (
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-3 bg-primary-blue-light px-4 py-2 rounded-custom cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => setShowTimeEditor(!showTimeEditor)}
              >
                <Calendar size={16} className="text-primary-blue" />
                <span className="text-sm font-medium text-gray-700">
                  {planDuration}-week plan
                </span>
                <Clock size={16} className="text-primary-blue" />
                <span className="text-sm font-medium text-gray-700">
                  {dailyTime} hr/day
                </span>
                <ChevronDown size={16} className="text-gray-500" />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-blue h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <span>{completedCount}/{totalItems} completed</span>
              </div>
            </div>
          )}

          {/* Time Editor Dropdown */}
          {showTimeEditor && (
            <div className="mt-3 p-4 bg-gray-50 rounded-custom border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Duration</label>
                  <select 
                    value={planDuration} 
                    onChange={(e) => setPlanDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-blue focus:outline-none"
                  >
                    <option value={2}>2 weeks</option>
                    <option value={4}>4 weeks</option>
                    <option value={6}>6 weeks</option>
                    <option value={8}>8 weeks</option>
                    <option value={12}>12 weeks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Time</label>
                  <select 
                    value={dailyTime} 
                    onChange={(e) => setDailyTime(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-blue focus:outline-none"
                  >
                    <option value={0.5}>30 minutes</option>
                    <option value={1}>1 hour</option>
                    <option value={1.5}>1.5 hours</option>
                    <option value={2}>2 hours</option>
                    <option value={3}>3 hours</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowTimeEditor(false);
                  fetchLearningPlan(query);
                }}
                className="mt-3 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors text-sm"
              >
                Update Plan
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Learning: <span className="text-primary-blue">{query}</span>
          </h1>
          {loading && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 size={16} className="animate-spin" />
              <span>Generating your personalized learning plan...</span>
            </div>
          )}
          {!loading && !error && planData && (
            <p className="text-gray-600">Your personalized {planDuration}-week learning roadmap 🎯</p>
          )}
        </div>

        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Error State */}
        {error && <ErrorMessage />}

        {/* Success State */}
        {!loading && !error && planData && (
          <>
            {/* AI Summary Card */}
            <div className="bg-gradient-to-r from-primary-blue-light to-white rounded-custom p-6 mb-8 shadow-gentle">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-primary-blue text-white rounded-lg">
                  📚
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">TL;DR - Best Advice from Reddit</h2>
                  <p className="text-gray-700 leading-relaxed">{planData.summary}</p>
                  {planData.sources.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Sources from:</p>
                      <div className="flex flex-wrap gap-2">
                        {planData.sources.map((source, index) => (
                          <span key={index} className="px-2 py-1 bg-white rounded-full text-xs text-gray-600 border">
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly Learning Plan */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Weekly Learning Plan</h2>
              <div className="space-y-4">
                {weeklyPlan.map((week) => (
                  <div key={week.week} className="bg-white rounded-custom shadow-gentle overflow-hidden">
                    <button
                      onClick={() => toggleWeek(week.week)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary-blue text-white rounded-full flex items-center justify-center font-semibold">
                          {week.week}
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-gray-800">{week.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {week.steps.filter(step => completedItems.has(`${week.week}-${step.title}`)).length}/{week.steps.length}
                        </span>
                        {expandedWeeks.includes(week.week) ? 
                          <ChevronDown size={20} className="text-gray-400" /> : 
                          <ChevronRight size={20} className="text-gray-400" />
                        }
                      </div>
                    </button>

                    {expandedWeeks.includes(week.week) && (
                      <div className="px-6 pb-6">
                        <div className="space-y-3">
                          {week.steps.map((step, index) => {
                            const itemId = `${week.week}-${step.title}`;
                            const isCompleted = completedItems.has(itemId);
                            
                            return (
                              <div key={index} className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-primary-blue-light'
                              }`}>
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={() => toggleItemCompletion(itemId)}
                                    className="mt-1 text-gray-400 hover:text-primary-blue transition-colors"
                                  >
                                    {isCompleted ? 
                                      <CheckCircle2 size={20} className="text-green-500" /> : 
                                      <Circle size={20} />
                                    }
                                  </button>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <h4 className={`font-medium ${isCompleted ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                                        {step.title}
                                      </h4>
                                      <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(step.type)}`}>
                                          {getTypeIcon(step.type)}
                                          {step.type}
                                        </span>
                                        {step.timeEstimate && (
                                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                            {step.timeEstimate}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <p className={`text-sm mb-3 ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                                      {step.description}
                                    </p>
                                    <div className="flex gap-2">
                                      <a
                                        href={step.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-1 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors text-sm font-medium"
                                      >
                                        Reddit Discussion
                                        <ExternalLink size={12} />
                                      </a>
                                      {step.resourceURL && (
                                        <a
                                          href={step.resourceURL}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                                        >
                                          {getResourceButtonText(step.resourceURL)}
                                          <ExternalLink size={12} />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Final Tip */}
            {planData.tip && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-custom p-6 mb-8">
                <div className="flex items-start gap-3">
                  <Lightbulb className="text-yellow-600 mt-1" size={20} />
                  <div>
                    <p className="text-gray-700">
                      <strong>💡 Pro Tip:</strong> {planData.tip}
                    </p>
                  </div>
                </div>
              </div>
            )}
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

export default ResultsPage;