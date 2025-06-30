export interface RedditPost {
  title: string;
  selftext: string;
  subreddit: string;
  permalink: string;
  url: string;
  score?: number;
  created_utc?: number;
}

export interface RedditComment {
  author: string;
  body: string;
  depth: number;
  replies: RedditComment[];
}

export interface FullPostDetails {
  post: RedditPost;
  comments: RedditComment[];
}

export interface ProgressUpdate {
  message: string;
  percentage: number;
}

export interface WeeklyPlanStep {
  title: string;
  description: string;
  href: string;
  resourceURL?: string;
  type: 'Video' | 'Article' | 'Practice' | 'Tip' | 'Forum';
  timeEstimate: string;
}

export interface WeeklyPlan {
  week: number;
  title: string;
  steps: WeeklyPlanStep[];
}

export interface LearningGuide {
  summary: string;
  sources: string[];
  weeklyPlan: WeeklyPlan[];
  tip: string;
}

// New types for Quick Insights mode
export interface InsightSource {
  title: string;
  subreddit: string;
  url: string;
  upvotes: number;
  summary: string;
}

export interface QuickInsights {
  summary: string;
  keyPoints: string[];
  commonMistakes: string[];
  recommendedResources: {
    title: string;
    description: string;
    url: string;
    type: 'Video' | 'Article' | 'Course' | 'Tool' | 'Community';
  }[];
  sources: InsightSource[];
  nextSteps: string[];
}

export type SearchMode = 'study-plan' | 'quick-insights';