import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

// Helper function to fetch Reddit posts
async function fetchRedditPosts(subreddit, query, limit = 15) {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=top&t=year&limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LearningPlanBot/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.children.map(child => child.data);
  } catch (error) {
    console.error(`Error fetching from r/${subreddit}:`, error);
    return [];
  }
}

// Helper function to rank posts
function rankPosts(posts) {
  const now = Date.now() / 1000; // Current time in seconds
  
  return posts
    .filter(post => post.ups > 5) // Filter out low-quality posts
    .map(post => {
      const ageInDays = (now - post.created_utc) / (24 * 60 * 60);
      const score = (post.ups * 0.7) + (1 / Math.max(ageInDays, 1) * 0.3);
      return { ...post, rankScore: score };
    })
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 10);
}

// Helper function to get top comment
async function getTopComment(permalink) {
  try {
    const url = `https://www.reddit.com${permalink}.json?limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LearningPlanBot/1.0'
      }
    });
    
    if (!response.ok) return '';
    
    const data = await response.json();
    const comments = data[1]?.data?.children || [];
    return comments[0]?.data?.body || '';
  } catch (error) {
    console.error('Error fetching comment:', error);
    return '';
  }
}

// Main API endpoint
app.get('/api/plan', async (req, res) => {
  try {
    const { topic } = req.query;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic parameter is required' });
    }

    console.log(`Generating learning plan for: ${topic}`);

    // Step 1: Build search terms
    const searchTerms = [
      `how to learn ${topic}`,
      `beginner roadmap ${topic}`,
      `getting started ${topic}`
    ];

    // Step 2: Fetch posts from multiple subreddits
    const subreddits = ['IWantToLearn', 'learnprogramming', topic.toLowerCase()];
    let allPosts = [];

    for (const subreddit of subreddits) {
      for (const searchTerm of searchTerms) {
        const posts = await fetchRedditPosts(subreddit, searchTerm, 10);
        allPosts = allPosts.concat(posts);
      }
    }

    // Step 3: Rank and filter posts
    const topPosts = rankPosts(allPosts);
    
    if (topPosts.length === 0) {
      return res.status(404).json({ error: 'No relevant posts found for this topic' });
    }

    // Step 4: Collect post content and top comments
    const postData = [];
    for (const post of topPosts.slice(0, 8)) {
      const topComment = await getTopComment(post.permalink);
      postData.push({
        title: post.title,
        selftext: post.selftext || '',
        topComment: topComment,
        permalink: `https://reddit.com${post.permalink}`,
        ups: post.ups
      });
    }

    // Step 5: Generate AI summary and weekly plan
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const contentForAI = postData.map(post => 
      `Title: ${post.title}\nContent: ${post.selftext}\nTop Comment: ${post.topComment}`
    ).join('\n\n---\n\n');

    const prompt = `Based on the following Reddit posts about learning ${topic}, create a structured 4-week learning plan and summary.

Reddit Content:
${contentForAI}

Please respond with a JSON object containing:
1. "aiSummary": A one-paragraph TL;DR of the best beginner advice
2. "weeklyPlan": An array of 4 weeks, each with:
   - week: number (1-4)
   - title: descriptive title for the week
   - description: what the learner will accomplish
   - items: array of 2-4 learning resources/activities, each with:
     - title: resource name
     - description: what they'll learn
     - url: link to resource (use actual Reddit links when relevant, or placeholder "#")
     - type: one of "Video", "Forum", "Article", "Practice", "Beginner Tip"
     - duration: estimated time like "30 min" (optional)

Focus on beginner-friendly, free resources. Make it practical and actionable.

Respond with valid JSON only:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let aiResponse;

    try {
      // Clean the response text and parse JSON
      let responseText = response.text().trim();
      
      // Remove markdown code blocks if present
      if (responseText.startsWith('```json')) {
        responseText = responseText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (responseText.startsWith('```')) {
        responseText = responseText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      aiResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw AI response:', response.text());
      
      // Fallback response
      aiResponse = {
        aiSummary: `The Reddit community recommends starting with the basics: practice daily for 15-30 minutes, use free online resources, join beginner communities for support, and don't be afraid to make mistakes. Most successful learners emphasize consistency over intensity when learning ${topic}.`,
        weeklyPlan: [
          {
            week: 1,
            title: "Getting Started & Fundamentals",
            description: "Learn the basics and set up your learning environment",
            items: [
              {
                title: `Introduction to ${topic}`,
                description: "Get familiar with the core concepts and terminology",
                url: postData[0]?.permalink || "#",
                type: "Article",
                duration: "30 min"
              },
              {
                title: "Join the Community",
                description: "Connect with other learners and find support",
                url: postData[1]?.permalink || "#",
                type: "Forum"
              }
            ]
          },
          {
            week: 2,
            title: "Building Core Skills",
            description: "Develop fundamental skills through practice",
            items: [
              {
                title: "Hands-on Practice",
                description: "Start with simple exercises and projects",
                url: postData[2]?.permalink || "#",
                type: "Practice",
                duration: "1 hour"
              }
            ]
          },
          {
            week: 3,
            title: "Intermediate Concepts",
            description: "Expand your knowledge with more advanced topics",
            items: [
              {
                title: "Advanced Techniques",
                description: "Learn more sophisticated approaches",
                url: postData[3]?.permalink || "#",
                type: "Video",
                duration: "45 min"
              }
            ]
          },
          {
            week: 4,
            title: "Apply & Share",
            description: "Create projects and get feedback from the community",
            items: [
              {
                title: "Create Your First Project",
                description: "Apply everything you've learned in a complete project",
                url: "#",
                type: "Practice",
                duration: "2 hours"
              },
              {
                title: "Share for Feedback",
                description: "Post your work and get constructive criticism",
                url: postData[4]?.permalink || "#",
                type: "Forum"
              }
            ]
          }
        ]
      };
    }

    res.json(aiResponse);

  } catch (error) {
    console.error('Error generating learning plan:', error);
    
    if (error.message.includes('Reddit')) {
      return res.status(502).json({ error: 'Reddit unreachable' });
    } else if (error.message.includes('AI') || error.message.includes('Gemini')) {
      return res.status(500).json({ error: 'AI summarization failed' });
    } else {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Make sure to set your GEMINI_API_KEY in the .env file');
});