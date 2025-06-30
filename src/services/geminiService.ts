import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LearningGuide } from '../types';

if (!import.meta.env.VITE_GEMINI_API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const PROMPT_TEMPLATE = `
You are an AI learning assistant. Your task is to create a beginner-friendly, week-by-week study plan by analyzing a provided JSON object containing top Reddit posts and their comments about a specific topic.

The user wants to learn about: "{{topic}}".
They have specified a time commitment of {{weeks}} weeks, dedicating about {{hoursPerDay}} hour(s) per day.

Here is the raw data from the top Reddit posts, in a JSON array format. Each element contains a post and its top comments.
--- START OF REDDIT DATA (JSON) ---
{{redditContext}}
--- END OF REDDIT DATA (JSON) ---

**Your Task:**
1.  **Analyze the Data**: Carefully read through all the provided Reddit posts and comments in the JSON data. Identify the most frequently recommended resources, advice, and project ideas for beginners.
2.  **Synthesize a Summary**: Create a concise 2-3 sentence "TL;DR" summary of the most important starting advice.
3.  **Structure a Weekly Plan**: Organize the synthesized advice and resources into a coherent, week-by-week study plan.
4.  **Generate Resource Links (CRITICAL):**
    *   Populate the \`sources\` array with the unique subreddit names found in the data (e.g., "r/learnprogramming").
    *   For each step in your plan, the \`href\` field **MUST** be the full URL to the Reddit post it was derived from. Construct this by prepending "https://www.reddit.com" to the post's 'permalink' value (e.g., "https://www.reddit.com/r/learnprogramming/comments/...").
    *   **Do not extract direct links from comments or posts.** Instead, if a step involves an external resource (like a video, article, or tutorial series), create a YouTube or Google search link for it in the \`resourceURL\` field.
    *   **For video content:** Create a YouTube search link. For example, if the advice is "watch a crash course on Figma", the \`resourceURL\` should be "https://www.youtube.com/results?search_query=figma+crash+course+for+beginners".
    *   **For non-video content (articles, docs):** Create a Google search link. Example: "https://www.google.com/search?q=learn+javascript+MDN+docs".
    *   Make the search queries specific and beginner-focused.
    *   If a step is just a general tip, discussion, or a project idea without a clear external resource to search for, **omit the \`resourceURL\` field entirely**.
5.  **Provide a Final Tip**: Distill the overall sentiment into a single, actionable tip for a beginner.

**Output Format:**
Your response MUST be a valid JSON object and nothing else. It must follow this exact structure:
{
  "summary": "Your 2-3 sentence TL;DR summary here.",
  "sources": ["r/example1", "r/example2"],
  "weeklyPlan": [
    {
      "week": 1,
      "title": "Week 1: Foundational Concepts",
      "steps": [
        {
          "title": "Resource Title (e.g., 'Watch: Intro to X')",
          "description": "A brief description of the step and why it's important, based on Reddit advice.",
          "href": "https://www.reddit.com/r/learnprogramming/comments/abc/example-post",
          "resourceURL": "https://www.youtube.com/results?search_query=intro+to+x+for+beginners",
          "type": "Video",
          "timeEstimate": "30-45 mins"
        },
        {
          "title": "A general tip from a discussion",
          "description": "A summary of some good advice found in a thread.",
          "href": "https://www.reddit.com/r/learnprogramming/comments/def/another-post",
          "type": "Tip",
          "timeEstimate": "5 mins"
        }
      ]
    }
  ],
  "tip": "Your single, overarching tip for a beginner."
}

Details for the plan:
- The number of weeks in "weeklyPlan" must match the user's request.
- Base your plan ONLY on the provided Reddit data.

Do not include any introductory text, just the raw JSON object.
`;

const SUBREDDIT_PROMPT_TEMPLATE = `
You are a helpful assistant that finds the best communities on Reddit for learning a new skill. Given a topic, your task is to identify 5-10 highly relevant subreddits where a beginner could find quality information, tutorials, and discussions.

Topic: "{{topic}}"

**Instructions:**
1.  Prioritize subreddits dedicated to learning (e.g., r/learnprogramming, r/IWantToLearn).
2.  Include subreddits specific to the topic itself (e.g., r/python for Python).
3.  Avoid overly broad or off-topic subreddits.
4.  Return ONLY a valid JSON array of strings, where each string is the subreddit name without the "r/" prefix. Do not include "r/".

**Example Output for "3D Modeling":**
["blenderhelp", "3Dmodeling", "learnart", "blender", "Maya"]

Your turn. Provide the JSON array for the topic "{{topic}}".
`;

export const getRelevantSubreddits = async (topic: string): Promise<string[]> => {
    const prompt = SUBREDDIT_PROMPT_TEMPLATE.replace(/{{topic}}/g, topic);
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.2,
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

        const parsedData = JSON.parse(jsonStr);
        if (Array.isArray(parsedData) && parsedData.every(item => typeof item === 'string')) {
            return parsedData;
        }
        throw new Error("AI response was not a string array.");

    } catch (error) {
        console.error("Error generating relevant subreddits:", error);
        return [];
    }
};

export const generateLearningGuide = async (topic: string, weeks: number, hoursPerDay: number, redditContext: string): Promise<LearningGuide> => {
  const prompt = PROMPT_TEMPLATE
    .replace(/{{topic}}/g, topic)
    .replace('{{weeks}}', String(weeks))
    .replace('{{hoursPerDay}}', String(hoursPerDay))
    .replace('{{redditContext}}', redditContext);
  
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
            temperature: 0.5,
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
    
    const parsedData = JSON.parse(jsonStr) as LearningGuide;
    
    if (!parsedData.summary || !Array.isArray(parsedData.weeklyPlan) || !parsedData.tip || !Array.isArray(parsedData.sources)) {
        throw new Error("AI response is missing required fields.");
    }

    return parsedData;

  } catch (error) {
    console.error("Error generating learning guide:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("The AI returned a response that we couldn't understand. Please try a different topic or try again.");
    }
    throw new Error("Could not generate a learning guide for this topic. The AI might be busy, please try again in a moment.");
  }
};