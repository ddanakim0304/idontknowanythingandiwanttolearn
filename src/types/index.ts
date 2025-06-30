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