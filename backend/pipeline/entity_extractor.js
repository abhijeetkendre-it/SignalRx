import { Groq } from "groq-sdk";
import { v4 as uuidv4 } from 'uuid';
import { GROQ_API_KEY } from "../config.js";

export class GroqAnalysisPipeline {
  constructor() {
    this.apiKey = GROQ_API_KEY;
    this.client = null;
    if (this.apiKey) {
      try {
        this.client = new Groq({ apiKey: this.apiKey });
      } catch (e) {
        console.error(`Failed to initialize Groq client: ${e.message}`);
      }
    }
  }

  isConfigured() {
    return this.client !== null;
  }

  async analyzePost(post) {
    if (!this.isConfigured()) {
      return { error: "Groq API key not configured" };
    }

    const prompt = `You are an advanced medical NLP pipeline for SignalRx, a patient safety monitoring system.
Analyze the following social media post for safety signals, entities, sentiment, and PII.

Post Author: ${post.author || ''}
Post Content: ${post.content || ''}

Perform the following tasks:
1. Extract medical entities (DRUG, SYMPTOM, CONDITION).
2. Determine sentiment related to healthcare safety (score from -1.0 to 1.0, label: positive/negative/safety_concern/neutral, intensity: 1-10).
3. Identify safety flags (e.g., adverse_reaction, hospitalization, quality_of_life, off_label_use).
4. Detect PII (Personally Identifiable Information like names, family relations, locations). If present, mask it in the content using [REDACTED].

Respond ONLY with a valid JSON object matching exactly this structure (no markdown, no backticks, just raw JSON):
{
  "entities": [
    {"text": "entity name", "type": "DRUG|SYMPTOM|CONDITION", "confidence": 0.95}
  ],
  "sentiment": {
    "score": -0.8,
    "label": "safety_concern",
    "intensity": 8
  },
  "safety_flags": ["adverse_reaction", "emerging_concern"],
  "pii_detected": true/false,
  "pii_types": ["family_relation", "location"],
  "pii_masked_content": "masked version of the post content"
}
`;

    try {
      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: "You are an automated medical JSON API. You only respond with raw, valid JSON." },
          { role: "user", content: prompt }
        ],
        model: "llama3-70b-8192",
        temperature: 0.0,
        max_tokens: 1000,
      });

      let responseText = chatCompletion.choices[0]?.message?.content?.trim() || "{}";

      if (responseText.startsWith("```json")) {
        responseText = responseText.slice(7, -3).trim();
      } else if (responseText.startsWith("```")) {
        responseText = responseText.slice(3, -3).trim();
      }

      const analysis = JSON.parse(responseText);

      return {
        id: `an-${uuidv4().substring(0, 8)}`,
        post_id: post.id,
        project_id: post.project_id,
        entities: analysis.entities || [],
        sentiment: analysis.sentiment || { score: 0.0, label: "neutral", intensity: 0 },
        safety_flags: analysis.safety_flags || [],
        pii_detected: analysis.pii_detected || false,
        pii_types: analysis.pii_types || [],
        pii_masked_content: analysis.pii_masked_content || "",
        analyzed_at: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error during Groq analysis: ${error.message}`);
      return { error: error.message };
    }
  }
}
