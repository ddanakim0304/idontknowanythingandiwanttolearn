import { GoogleGenerativeAI } from "@google/generative-ai";
import type { QuickInsights } from '../types';

if (!import.meta.env.VITE_GEMINI_API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const INSIGHTS_PROMPT_TEMPLATE = `
You are an AI research assistant that synthesizes advice from Reddit discussions into actionable insights. Your task is to analyze Reddit posts and comments about a specific topic and create a comprehensive summary similar to what Perplexity AI would provide.

Topic: "{{topic}}"

Here is the raw data from Reddit posts and comments in JSON format:
--- START OF REDDIT DATA (JSON) ---
{{redditContext}}
--- END OF REDDIT DATA (JSON) ---

**Your Task:**
1. **Create a Comprehensive Summary**: Write a 3-4 sentence overview of the most important advice for beginners
2. **Extract Key Points**: Identify 4-6 essential points that beginners should know
3. **Common Mistakes**: List 3-4 mistakes that beginners frequently make based on the discussions
4. **Recommended Resources**: Extract and categorize the most frequently mentioned resources
5. **Source Attribution**: Create source entries for the most valuable posts
6. **Next Steps**: Provide 3-4 actionable next steps for someone just starting

**Output Format:**
Your response MUST be a valid JSON object with this exact structure:
{
  "summary": "A comprehensive 3-4 sentence summary of the key advice for learning this topic.",
  "keyPoints": [
    "Essential point 1 that beginners should understand",
    "Essential point 2 about getting started",
    "Essential point 3 about best practices",
    "Essential point 4 about resources or tools"
  ],
  "commonMistakes": [
    "Common mistake 1 that beginners make",
    "Common mistake 2 to avoid",
    "Common mistake 3 that wastes time"
  ],
  "recommendedResources": [
    {
      "title": "Resource name (e.g., 'Python.org Official Tutorial')",
      "description": "Brief description of why this resource is recommended",
      "url": "https://www.youtube.com/results?search_query=resource+name+for+beginners",
      "type": "Video"
    }
  ],
  "sources": [
    {
      "title": "Reddit post title",
      "subreddit": "r/subredditname",
      "url": "https://www.reddit.com/r/subreddit/comments/...",
      "upvotes": 0,
      "summary": "Brief summary of what this post contributed to the insights"
    }
  ],
  "nextSteps": [
    "Actionable step 1 to get started immediately",
    "Actionable step 2 for the first week",
    "Actionable step 3 for building momentum"
  ]
}

**Important Guidelines:**
- Base all insights ONLY on the provided Reddit data
- For recommendedResources, create search URLs for YouTube (videos) or Google (articles/docs)
- Make search queries specific and beginner-focused
- Include actual Reddit post URLs in sources using the permalink data
- Focus on practical, actionable advice
- Prioritize beginner-friendly information

Do not include any introductory text, just the raw JSON object.
`;

export const generateQuickInsights = async (topic: string, redditContext: string): Promise<QuickInsights> => {
  const prompt = INSIGHTS_PROMPT_TEMPLATE
    .replace(/{{topic}}/g, topic)
    .replace('{{redditContext}}', redditContext);
  
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json"
        }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonStr = response.text().trim();
    
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as QuickInsights;
    
    if (!parsedData.summary || !Array.isArray(parsedData.keyPoints) || !Array.isArray(parsedData.sources)) {
        throw new Error("AI response is missing required fields.");
    }

    return parsedData;

  } catch (error) {
    console.error("Error generating quick insights:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("The AI returned a response that we couldn't understand. Please try a different topic or try again.");
    }
    throw new Error("Could not generate insights for this topic. The AI might be busy, please try again in a moment.");
  }
};