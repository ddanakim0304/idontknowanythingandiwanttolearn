import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LearningInsights } from '../types';

if (!import.meta.env.VITE_GEMINI_API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const INSIGHTS_PROMPT_TEMPLATE = `
You are an AI learning advisor that synthesizes advice from Reddit discussions into actionable learning insights. Your task is to analyze Reddit posts and comments about a specific topic and create a comprehensive learning summary with key insights, common pitfalls, and recommended resources.

Topic: "{{topic}}"

Here is the raw data from Reddit posts and comments in JSON format:
--- START OF REDDIT DATA (JSON) ---
{{redditContext}}
--- END OF REDDIT DATA (JSON) ---

**Your Task:**
1. **Create a Learning Summary**: Write a 3-4 sentence overview of the most important advice for beginners learning this topic
2. **Extract Key Learning Points**: Identify 4-6 essential insights that beginners should know when starting to learn this topic
3. **Common Learning Mistakes**: List 3-4 mistakes that beginners frequently make based on the discussions
4. **Recommended Learning Resources**: Extract and categorize the most frequently mentioned learning resources
5. **Source Attribution**: Create source entries for the most valuable posts that contributed to these insights
6. **Next Learning Steps**: Provide 3-4 actionable next steps for someone just starting to learn this topic

**Output Format:**
Your response MUST be a valid JSON object with this exact structure:
{
  "summary": "A comprehensive 3-4 sentence summary of the key learning advice for this topic.",
  "keyPoints": [
    "Essential learning insight 1 that beginners should understand",
    "Essential learning insight 2 about getting started effectively",
    "Essential learning insight 3 about best learning practices",
    "Essential learning insight 4 about resources or learning methods"
  ],
  "commonMistakes": [
    "Common learning mistake 1 that beginners make",
    "Common learning mistake 2 to avoid when starting",
    "Common learning mistake 3 that wastes learning time"
  ],
  "recommendedResources": [
    {
      "title": "Learning resource name (e.g., 'Python.org Official Tutorial')",
      "description": "Brief description of why this resource is recommended for learning",
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
      "summary": "Brief summary of what learning insights this post contributed"
    }
  ],
  "nextSteps": [
    "Actionable learning step 1 to get started immediately",
    "Actionable learning step 2 for the first week of learning",
    "Actionable learning step 3 for building learning momentum"
  ]
}

**Important Guidelines:**
- Base all insights ONLY on the provided Reddit data
- Focus on learning-specific advice and insights
- For recommendedResources, create search URLs for YouTube (videos) or Google (articles/docs)
- Make search queries specific and beginner-focused for learning
- Include actual Reddit post URLs in sources using the permalink data
- Focus on practical, actionable learning advice
- Prioritize beginner-friendly learning information

Do not include any introductory text, just the raw JSON object.
`;

export const generateLearningInsights = async (topic: string, redditContext: string): Promise<LearningInsights> => {
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
    
    const parsedData = JSON.parse(jsonStr) as LearningInsights;
    
    if (!parsedData.summary || !Array.isArray(parsedData.keyPoints) || !Array.isArray(parsedData.sources)) {
        throw new Error("AI response is missing required fields.");
    }

    return parsedData;

  } catch (error) {
    console.error("Error generating learning insights:", error);
    
    // Check for quota exceeded error
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('exceeded your current quota'))) {
        throw new Error("You've reached your daily limit for AI requests. Please check your Google AI Studio account at https://aistudio.google.com/ to view your quota and billing details, or try again tomorrow.");
    }
    
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("The AI returned a response that we couldn't understand. Please try a different topic or try again.");
    }
    throw new Error("Could not generate learning insights for this topic. The AI might be busy, please try again in a moment.");
  }
};