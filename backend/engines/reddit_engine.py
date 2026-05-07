import praw
import uuid
import requests
from datetime import datetime
from typing import List, Dict

class RedditEngine:
    """
    Live Data Acquisition Engine for Reddit using PRAW with a public JSON fallback.
    Fetches real-time submissions matching keywords from target subreddits.
    """
    def __init__(self, client_id: str, client_secret: str, user_agent: str = "SignalRx:v1.0 (by /u/SignalRx)"):
        self.client_id = client_id
        self.client_secret = client_secret
        self.user_agent = user_agent
        self.reddit = None
        
        # Try to initialize PRAW if keys exist
        if self.client_id and self.client_secret:
            try:
                self.reddit = praw.Reddit(
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    user_agent=self.user_agent
                )
            except Exception as e:
                print(f"Failed to initialize Reddit engine: {e}")

    def is_configured(self) -> bool:
        # We now consider it always configured because we have a fallback!
        return True

    def fetch_data(self, project_id: str, keywords: List[str], subreddits: List[str] = ["medicine", "AskDocs", "diabetes", "pharmacy", "health"], limit: int = 10) -> List[Dict]:
        """
        Scrape subreddits for keywords and return normalized post objects.
        """
        target_subreddits = "+".join(subreddits)
        query = " OR ".join(keywords)

        # 1. Use PRAW if configured
        if self.reddit:
            try:
                fetched_posts = []
                subreddit = self.reddit.subreddit(target_subreddits)
                for submission in subreddit.search(query, sort='new', limit=limit):
                    fetched_posts.append(self._normalize_post(submission, project_id))
                return fetched_posts
            except Exception as e:
                print(f"PRAW fetch failed, using fallback: {e}")

        # 2. Fallback: Use public Reddit JSON API (No Keys Required!)
        print("Using Reddit public JSON fallback...")
        try:
            headers = {'User-Agent': self.user_agent}
            # Just search the first keyword for simplicity in the fallback URL
            search_query = keywords[0] if keywords else "health"
            url = f"https://www.reddit.com/r/{target_subreddits}/search.json?q={search_query}&sort=new&limit={limit}&restrict_sr=on"
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            fetched_posts = []
            for child in data.get('data', {}).get('children', []):
                item = child['data']
                fetched_posts.append(self._normalize_json_post(item, project_id))
                
            return fetched_posts
            
        except Exception as e:
            print(f"Error in Reddit JSON fallback: {e}")
            return [{"error": str(e)}]

    def _normalize_post(self, item, project_id: str) -> Dict:
        """
        Convert PRAW submission into SignalRx Post schema.
        """
        return {
            "id": f"rd-{str(uuid.uuid4())[:8]}",
            "project_id": project_id,
            "source": "reddit",
            "author": f"u/{item.author.name}" if item.author else "u/deleted",
            "content": f"{item.title}\n{item.selftext}",
            "url": f"https://reddit.com{item.permalink}",
            "timestamp": datetime.fromtimestamp(item.created_utc).isoformat(),
            "ingested_at": datetime.now().isoformat(),
            "metadata": {
                "subreddit": item.subreddit.display_name,
                "score": item.score,
                "num_comments": item.num_comments
            }
        }

    def _normalize_json_post(self, item: dict, project_id: str) -> Dict:
        """
        Convert raw JSON post into SignalRx Post schema.
        """
        return {
            "id": f"rd-{str(uuid.uuid4())[:8]}",
            "project_id": project_id,
            "source": "reddit",
            "author": f"u/{item.get('author', 'deleted')}",
            "content": f"{item.get('title', '')}\n{item.get('selftext', '')}",
            "url": f"https://reddit.com{item.get('permalink', '')}",
            "timestamp": datetime.fromtimestamp(item.get('created_utc', datetime.now().timestamp())).isoformat(),
            "ingested_at": datetime.now().isoformat(),
            "metadata": {
                "subreddit": item.get('subreddit', ''),
                "score": item.get('score', 0),
                "num_comments": item.get('num_comments', 0)
            }
        }
