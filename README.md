# Learning Plan Generator

A Reddit-powered learning plan generator that creates personalized weekly roadmaps using AI.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your Gemini API key:**
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Copy `.env` and replace `YOUR_GEMINI_API_KEY_HERE` with your actual key

3. **Start the backend server:**
   ```bash
   npm run server
   ```

4. **Start the frontend (in another terminal):**
   ```bash
   npm run dev
   ```

5. **Visit** `http://localhost:5173` and start learning!

## How It Works

1. **Reddit Scraping**: Searches multiple subreddits for "how to learn X" posts
2. **Content Ranking**: Ranks posts by upvotes and recency
3. **AI Processing**: Uses Gemini AI to generate structured learning plans
4. **Personalized Output**: Creates 4-week roadmaps with resources and progress tracking

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js
- **AI**: Google Gemini Pro
- **Data Source**: Reddit JSON API

## Features

- ✨ AI-generated learning summaries
- 📅 Customizable time commitments
- ✅ Progress tracking with checkboxes
- 🎯 Beginner-friendly resource filtering
- 📱 Fully responsive design

Built with ❤️ by learners, for learners.