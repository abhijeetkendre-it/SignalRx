import os
import json
import uuid
from datetime import datetime
from groq import Groq
from config import GROQ_API_KEY

class GroqAnalysisPipeline:
    """
    AI Pipeline using Groq (Llama-3) to extract entities, sentiment, and flag PII from raw posts.
    """
    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.client = None
        if self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                print(f"Failed to initialize Groq client: {e}")

    def is_configured(self):
        return self.client is not None

    def analyze_post(self, post: dict) -> dict:
        """
        Takes a raw post dict and returns an AnalyzedPost dict using Llama 3 via Groq.
        """
        if not self.is_configured():
            return {"error": "Groq API key not configured"}

        prompt = f"""
You are an advanced medical NLP pipeline for SignalRx, a patient safety monitoring system.
Analyze the following social media post for safety signals, entities, sentiment, and PII.

Post Author: {post.get('author')}
Post Content: {post.get('content')}

Perform the following tasks:
1. Extract medical entities (DRUG, SYMPTOM, CONDITION).
2. Determine sentiment related to healthcare safety (score from -1.0 to 1.0, label: positive/negative/safety_concern/neutral, intensity: 1-10).
3. Identify safety flags (e.g., adverse_reaction, hospitalization, quality_of_life, off_label_use).
4. Detect PII (Personally Identifiable Information like names, family relations, locations). If present, mask it in the content using [REDACTED].

Respond ONLY with a valid JSON object matching exactly this structure (no markdown, no backticks, just raw JSON):
{{
  "entities": [
    {{"text": "entity name", "type": "DRUG|SYMPTOM|CONDITION", "confidence": 0.95}}
  ],
  "sentiment": {{
    "score": -0.8,
    "label": "safety_concern",
    "intensity": 8
  }},
  "safety_flags": ["adverse_reaction", "emerging_concern"],
  "pii_detected": true/false,
  "pii_types": ["family_relation", "location"],
  "pii_masked_content": "masked version of the post content"
}}
"""

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an automated medical JSON API. You only respond with raw, valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama3-70b-8192",
                temperature=0.0,
                max_tokens=1000,
            )
            
            response_text = chat_completion.choices[0].message.content.strip()
            
            # Clean up response if it wrapped in markdown by mistake
            if response_text.startswith("```json"):
                response_text = response_text[7:-3]
            elif response_text.startswith("```"):
                response_text = response_text[3:-3]
                
            analysis = json.loads(response_text)
            
            # Build the analyzed post schema
            return {
                "id": f"an-{str(uuid.uuid4())[:8]}",
                "post_id": post["id"],
                "project_id": post["project_id"],
                "entities": analysis.get("entities", []),
                "sentiment": analysis.get("sentiment", {"score": 0.0, "label": "neutral", "intensity": 0}),
                "safety_flags": analysis.get("safety_flags", []),
                "pii_detected": analysis.get("pii_detected", False),
                "pii_types": analysis.get("pii_types", []),
                "pii_masked_content": analysis.get("pii_masked_content", ""),
                "analyzed_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error during Groq analysis: {e}")
            return {"error": str(e)}
