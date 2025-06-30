# AI Learning Plan Generator

A Reddit-powered learning plan generator that creates personalized weekly roadmaps using Google's Gemini AI.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your Gemini API key:**
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Copy `.env.example` to `.env` and replace `your_gemini_api_key_here` with your actual key

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Visit** `http://localhost:5173` and start learning!

## How It Works

1. **Reddit Discovery**: Searches multiple subreddits for "how to learn X" posts using intelligent subreddit detection
2. **AI Content Filtering**: Uses Gemini AI to filter and rank posts for beginner relevance
3. **Deep Analysis**: Fetches full post details and top comments for comprehensive context
4. **Personalized Planning**: Generates structured 4-week learning plans with direct links to Reddit discussions and external resources
5. **Progress Tracking**: Interactive checkboxes and progress visualization

## Features

- ✨ **AI-powered content curation** from Reddit discussions
- 🎯 **Intelligent subreddit discovery** for targeted searches
- 📅 **Customizable time commitments** (2-12 weeks, 30min-3hrs/day)
- ✅ **Progress tracking** with interactive checkboxes
- 🔗 **Direct links** to Reddit discussions and external resources
- 📱 **Fully responsive design** with beautiful UI
- 🚀 **Real-time progress updates** during plan generation

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **AI**: Google Gemini 1.5 Flash
- **Data Source**: Reddit JSON API (no authentication required)
- **Build Tool**: Vite

## Architecture

The app uses a clean, modular architecture:

- `src/services/redditService.ts` - Reddit API integration and content filtering
- `src/services/geminiService.ts` - AI-powered learning plan generation
- `src/types/index.ts` - TypeScript type definitions
- `src/components/` - React components with beautiful, production-ready UI

## Environment Variables

Create a `.env` file with:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## API Limits

- Reddit API: No authentication required, rate-limited
- Gemini API: Requires API key, generous free tier available

Built with ❤️ for learners everywhere.