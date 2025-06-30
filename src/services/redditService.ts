import { GoogleGenerativeAI } from "@google/generative-ai";
import type { RedditPost, RedditComment, FullPostDetails, ProgressUpdate } from "../types";
import { getRelevantSubreddits } from "./geminiService";

if (!import.meta.env.VITE_GEMINI_API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const REDDIT_API_URL = "https://www.reddit.com";
const USER_AGENT = "web:ai-learning-plan-generator:v1.0";

export type RedditTimeframe = "hour" | "day" | "week" | "month" | "year" | "all";

const DEFAULT_WINDOW_YEARS = 5;
const SECONDS_IN_YEAR = 31_536_000;

const buildSubredditClause = (subs: string[]) =>
  subs.map((s) => `subreddit:${s}`).join(" OR ");

const normalizePermalink = (url: string) =>
  url.replace(/^https?:\/\/(www\.)?reddit\.com/, "").replace(/\/$/, "");

const timestampYearsAgo = (years: number) =>
  Math.floor(Date.now() / 1000) - years * SECONDS_IN_YEAR;

const searchReddit = async (
  topic: string,
  subreddits: string[] = [],
  windowYears: number = DEFAULT_WINDOW_YEARS,
): Promise<RedditPost[]> => {
  let q = `((how to learn ${topic}) OR (beginner resources ${topic}) OR (${topic} roadmap))`;

  if (subreddits.length > 0) {
    q = `(${buildSubredditClause(subreddits)}) AND ${q}`;
  }

  const url = `${REDDIT_API_URL}/search.json?q=${encodeURIComponent(q)}&sort=top&t=all&limit=50`;

  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) throw new Error(`Reddit search API status: ${response.status}`);

    const data = await response.json();
    if (!data?.data?.children) return [];

    const cutoff = windowYears === Infinity ? 0 : timestampYearsAgo(windowYears);

    const posts: RedditPost[] = data.data.children
      .map((post: any) => ({
        title: post.data.title,
        selftext: post.data.selftext ?? "",
        subreddit: post.data.subreddit_name_prefixed,
        permalink: post.data.permalink,
        url: post.data.url,
        score: post.data.score ?? 0,
        created_utc: post.data.created_utc ?? 0,
      }))
      .filter((p) => p.created_utc >= cutoff);

    console.log(
      `🔍 Found ${posts.length} Reddit posts for query (≤${windowYears} yrs): "${q.slice(0, 70)}..."`,
    );
    return posts;
  } catch (error) {
    console.error(`Error in searchReddit with query "${q}":`, error);
    return [];
  }
};

const AI_FILTER_PROMPT_TEMPLATE = `
You are an AI content filter. Your task is to analyse a list of Reddit post titles and determine which ones are most relevant for a beginner who wants to learn about a specific topic.

Topic: "{{topic}}"

I will provide you with a JSON array of post objects. Identify the posts that are most likely to contain beginner guides, resource lists, roadmaps, or "getting started" advice. Filter out posts that seem like specific niche questions, show-off projects, memes, or discussions that are too advanced.

Here are the posts:
{{postsJson}}

**Instructions:**
1.  Analyse each post based on its title and subreddit.
2.  Return a **JSON array of strings**, where each string is the **relative** 'permalink' of a relevant post (e.g. "/r/learnprogramming/comments/...").
3.  Prioritise high-quality, educational posts. Aim for the top 5‑7 most relevant posts.
4.  The output must be a valid JSON array of strings. For example: ["/r/learnprogramming/comments/...", "/r/gamedev/comments/..."]
5.  If no posts are relevant, return an empty array [].
`;

const filterPostsWithAI = async (
  posts: RedditPost[],
  topic: string,
): Promise<RedditPost[]> => {
  if (posts.length === 0) return [];

  console.log(`🤖 AI Filtering: Starting with ${posts.length} candidate posts.`);
  const postsForPrompt = posts.map((p) => ({
    title: p.title,
    permalink: p.permalink,
    subreddit: p.subreddit,
  }));

  const prompt = AI_FILTER_PROMPT_TEMPLATE
    .replace("{{topic}}", topic)
    .replace("{{postsJson}}", JSON.stringify(postsForPrompt, null, 2));

  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonStr = response.text().trim();
    
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) jsonStr = match[2].trim();

    const relevantPermalinks = JSON.parse(jsonStr) as string[];
    if (!Array.isArray(relevantPermalinks)) throw new Error("AI response was not an array of permalinks.");

    const relevantSet = new Set(relevantPermalinks.map(normalizePermalink));
    const filteredPosts = posts.filter((p) => relevantSet.has(normalizePermalink(p.permalink)));

    console.log(`✅ AI Filtering: Finished. Selected ${filteredPosts.length} relevant posts.`);
    return filteredPosts.length > 0 ? filteredPosts : posts;
  } catch (error) {
    console.error("Error filtering posts with AI:", error);
    return posts;
  }
};

const parseCommentTree = (commentData: any[], depth = 0): RedditComment[] => {
  if (!commentData || !Array.isArray(commentData)) return [];

  return commentData
    .map((comment: any): RedditComment | null => {
      if (comment.kind !== "t1" || !comment.data?.body) return null;
      const replies = comment.data.replies?.data?.children
        ? parseCommentTree(comment.data.replies.data.children, depth + 1)
        : [];
      return { author: comment.data.author, body: comment.data.body, depth, replies };
    })
    .filter((c): c is RedditComment => c !== null);
};

const getPostDetailsAndComments = async (
  permalink: string,
): Promise<FullPostDetails> => {
  const url = `${REDDIT_API_URL}${permalink}.json`;

  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) throw new Error(`Reddit post detail API status: ${response.status}`);

    const data = await response.json();

    const postData = data[0].data.children[0].data;
    const commentData = data[1].data.children;

    const post: RedditPost = {
      title: postData.title,
      selftext: postData.selftext ?? "",
      subreddit: postData.subreddit_name_prefixed,
      permalink: postData.permalink,
      url: postData.url,
    };

    const comments = parseCommentTree(commentData);

    console.log(`📄 Fetched details for: "${post.title}" (${comments.length} comments)`);

    return { post, comments };
  } catch (error) {
    console.error(`Error fetching details for ${permalink}:`, error);
    throw new Error(`Could not fetch details for post ${permalink}.`);
  }
};

export const getRichRedditContextForTopic = async (
  topic: string,
  onProgress: (update: ProgressUpdate) => void,
): Promise<string> => {
  onProgress({ message: `🚀 Kicking off the search for "${topic}"...`, percentage: 0 });

  onProgress({ message: "🗺️ Charting the Reddit territory for the best communities...", percentage: 10 });
  const relevantSubreddits = await getRelevantSubreddits(topic);
  if (relevantSubreddits.length > 0) {
    onProgress({ message: `📍 Found promising hubs: ${relevantSubreddits.join(", ")}`, percentage: 25 });
  } else {
    onProgress({ message: "🧐 Couldn't find specific communities, going for a wider search!", percentage: 25 });
  }

  onProgress({ message: "🎣 Casting a wide net for popular posts...", percentage: 40 });
  const searchPromises: Promise<RedditPost[]>[] = [searchReddit(topic)];
  if (relevantSubreddits.length > 0) {
    searchPromises.push(searchReddit(topic, relevantSubreddits));
  }
  const searchResults = await Promise.all(searchPromises);

  const allPosts: RedditPost[] = [];
  const seenPermalinks = new Set<string>();
  for (const postList of searchResults) {
    for (const post of postList) {
      if (!seenPermalinks.has(post.permalink)) {
        seenPermalinks.add(post.permalink);
        allPosts.push(post);
      }
    }
  }
  if (allPosts.length === 0) {
    console.log("❌ No Reddit posts found for this topic after all searches.");
    return "";
  }

  onProgress({ message: `🧐 AI is reading ${allPosts.length} posts to find beginner gems...`, percentage: 60 });
  const finalPosts = await filterPostsWithAI(allPosts, topic);
  if (finalPosts.length === 0) {
    console.log("❌ AI filtering resulted in 0 posts. Using fallback.");
    throw new Error(
      "We found some Reddit posts, but our AI filter couldn't identify any that were suitable for beginners. Please try a different topic.",
    );
  }

  onProgress({ message: `✨ Distilling wisdom from the top ${finalPosts.length} posts...`, percentage: 75 });
  const detailPromises = finalPosts.map((p) => getPostDetailsAndComments(p.permalink));
  const results = await Promise.allSettled(detailPromises);

  const successfulDetails: FullPostDetails[] = [];
  results.forEach((result, index) => {
      if (result.status === "fulfilled") {
          const { post, comments } = result.value;
          const trimmedPost: RedditPost = {
              ...post,
              selftext: post.selftext.slice(0, 2000),
          };
          const trimmedComments: RedditComment[] = comments.slice(0, 10).map(comment => ({
              ...comment,
              body: comment.body.slice(0, 750),
              replies: [],
          }));
          successfulDetails.push({ post: trimmedPost, comments: trimmedComments });
          console.log(`✅ Processed post ${index + 1}/${finalPosts.length}: "${post.title}"`);
      } else {
          console.log(`❌ Failed to fetch post detail ${index + 1}:`, result.reason);
      }
  });

  if (successfulDetails.length === 0) {
      console.log("❌ All post detail fetches failed");
      throw new Error("Found Reddit posts, but could not fetch their details. The posts may have been deleted or Reddit is temporarily unavailable.");
  }
  
  const usedSubreddits = new Set(successfulDetails.map(d => d.post.subreddit));
  const totalComments = successfulDetails.reduce((sum, d) => sum + d.comments.length, 0);

  console.log("\n📊 REDDIT DATA SUMMARY FOR GEMINI:");
  console.log(`   Total posts to be processed: ${successfulDetails.length}`);
  console.log(`   Total comments included: ${totalComments}`);
  console.log(`   Subreddits used: ${Array.from(usedSubreddits).join(", ")}`);

  const fullContext = JSON.stringify(successfulDetails, null, 2);
  console.log(`   Context length: ${fullContext.length} characters`);

  return fullContext;
};