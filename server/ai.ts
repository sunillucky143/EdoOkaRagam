import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MusicRecommendation {
  trackTitle: string;
  artist: string;
  reason: string;
  mood: string;
}

export interface ConversationContext {
  messages: Array<{
    username: string;
    message: string;
    timestamp: Date;
  }>;
  recentTracks?: Array<{
    title: string;
    artist: string;
    album: string;
  }>;
}

export async function generateMusicRecommendations(
  context: ConversationContext,
  count: number = 5
): Promise<MusicRecommendation[]> {
  try {
    const conversationText = context.messages
      .map(m => `${m.username}: ${m.message}`)
      .join('\n');

    const recentTracksText = context.recentTracks
      ? `\n\nRecently played tracks:\n${context.recentTracks.map(t => `- ${t.title} by ${t.artist}`).join('\n')}`
      : '';

    const prompt = `Based on the following conversation between friends and their music preferences, suggest ${count} songs that would fit the mood and context. Consider the topics discussed, emotions expressed, and any music mentioned.

Conversation:
${conversationText}${recentTracksText}

Respond with JSON in this format:
{
  "recommendations": [
    {
      "trackTitle": "song title",
      "artist": "artist name",
      "reason": "why this song fits the conversation",
      "mood": "the overall mood/vibe"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a music recommendation expert that analyzes conversations to suggest perfect songs. You understand mood, context, and musical preferences."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.recommendations || [];
  } catch (error) {
    console.error("Failed to generate music recommendations:", error);
    return [];
  }
}

export async function analyzeMusicMood(
  tracks: Array<{ title: string; artist: string; album: string }>
): Promise<{ mood: string; description: string }> {
  try {
    const tracksText = tracks.map(t => `${t.title} by ${t.artist}`).join(', ');

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a music analysis expert. Analyze the overall mood and vibe of a collection of songs."
        },
        {
          role: "user",
          content: `Analyze the mood of these songs: ${tracksText}. Respond with JSON: { "mood": "one or two word mood", "description": "brief description of the vibe" }`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      mood: result.mood || "Unknown",
      description: result.description || "No description available"
    };
  } catch (error) {
    console.error("Failed to analyze music mood:", error);
    return { mood: "Unknown", description: "Could not analyze mood" };
  }
}

export async function generatePlaylistDescription(
  playlistName: string,
  tracks: Array<{ title: string; artist: string }>
): Promise<string> {
  try {
    const tracksText = tracks.slice(0, 10).map(t => `${t.title} by ${t.artist}`).join(', ');

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a creative music curator. Write engaging, concise playlist descriptions."
        },
        {
          role: "user",
          content: `Write a short, engaging description (max 2 sentences) for a playlist named "${playlistName}" containing: ${tracksText}`
        }
      ],
      max_completion_tokens: 150,
    });

    return response.choices[0].message.content || "A great collection of music.";
  } catch (error) {
    console.error("Failed to generate playlist description:", error);
    return "A curated collection of music.";
  }
}
