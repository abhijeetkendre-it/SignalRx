import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export class RedditEngine {
  constructor(clientId, clientSecret, userAgent = "SignalRx:v1.0 (by /u/SignalRx)") {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.userAgent = userAgent;
  }

  isConfigured() {
    return true; // We use the fallback API which requires no config
  }

  async fetchData(projectId, keywords, subreddits = ["medicine", "AskDocs", "diabetes", "pharmacy", "health"], limit = 5) {
    const targetSubreddits = subreddits.join("+");
    const searchQuery = keywords && keywords.length > 0 ? keywords[0] : "health";
    
    console.log("Using Reddit public JSON fallback...");
    try {
      const url = `https://www.reddit.com/r/${targetSubreddits}/search.json?q=${encodeURIComponent(searchQuery)}&sort=new&limit=${limit}&restrict_sr=on`;
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent }
      });
      
      const data = response.data;
      const fetchedPosts = [];
      const children = data?.data?.children || [];
      
      for (const child of children) {
        fetchedPosts.push(this._normalizeJsonPost(child.data, projectId));
      }
      return fetchedPosts;
    } catch (error) {
      console.error(`Error in Reddit JSON fallback: ${error.message}`);
      return [{ error: error.message }];
    }
  }

  _normalizeJsonPost(item, projectId) {
    return {
      id: `rd-${uuidv4().substring(0, 8)}`,
      project_id: projectId,
      source: "reddit",
      author: `u/${item.author || 'deleted'}`,
      content: `${item.title || ''}\n${item.selftext || ''}`,
      url: `https://reddit.com${item.permalink || ''}`,
      timestamp: new Date((item.created_utc || Date.now() / 1000) * 1000).toISOString(),
      ingested_at: new Date().toISOString(),
      metadata: {
        subreddit: item.subreddit || '',
        score: item.score || 0,
        num_comments: item.num_comments || 0
      }
    };
  }
}
