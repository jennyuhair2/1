import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Initialize Gemini API
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route for Image Transformation
  app.post("/api/transform", async (req, res) => {
    try {
      const { image, gender } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Missing image data" });
      }

      // Remove base64 header if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

      const prompt = `
        ULTRA-DRASTIC FACE SWAP & INFLUENCER TRANSFORMATION
        
        This is for a ultra-luxury hair salon portfolio. You must execute a complete identity replacement. The final face MUST be 100% unrecognizable from the original person.
        
        CRITICAL MANDATES:
        1. COMPLETE IDENTITY OVERHAUL: Replace the entire face with a top-tier, world-class beauty or handsome influencer identity. The bone structure, eyes, nose, and lips must be completely redefined to create a "wow-factor" celebrity look. ZERO traces of the original facial features should remain.
        2. PERFECT SEAMLESS BLENDING: The new face must be perfectly integrated into the original head position. The skin transition between the forehead/cheeks and the original hairline MUST be invisible.
        3. 8K REALISM: Maintain absolute photographic realism. Preserve realistic skin textures, pores, and natural lighting. Avoid any artificial, plastic, or "AI-generated" appearance.
        4. ABSOLUTE HAIR LOCK: Do NOT modify a single strand of hair. The hair texture, color, volume, and stray hairs MUST stay 100% identical to the original photo.
        5. PHYSICAL INTEGRATION: The jawline and neck must blend perfectly with the original body. The lighting on the new face must perfectly match the existing shadows and highlights of the environment.
        6. ENV & CLOTHING LOCK: 1:1 preservation of the background, clothing, and overall composition.
        
        Target Gender: ${gender || "automatically detected"}.
        The final image must look like a high-end fashion magazine spread featuring a professional model.
        
        Return ONLY the modified image.
      `;

      const response = await ai.models.generateContent({
        // Using gemini-2.5-flash-image for reliable, multimodal image editing
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/png",
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        },
      });

      let resultImageBase64 = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          resultImageBase64 = part.inlineData.data;
          break;
        }
      }

      if (!resultImageBase64) {
        // Fallback for debugging if text is returned instead
        const textResponse = response.text;
        console.error("No image part returned from Gemini:", textResponse);
        return res.status(500).json({ error: "AI failed to generate a modified image.", details: textResponse });
      }

      res.json({ image: `data:image/png;base64,${resultImageBase64}` });

    } catch (error: any) {
      console.error("Transformation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for Review Reply Generation
  app.post("/api/generate-reply", async (req, res) => {
    try {
      const { designer, review, style } = req.body;

      if (!designer || !review || !style) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const currentDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

      const prompt = `
        You are an AI assistant for "Jenny U Hair Boutique" (제니유헤어부티크), a premium hair salon in Korea.
        Your task is to write a warm, engaging, and professional reply to a customer's review.
        
        CONTEXT:
        - Current Date: ${currentDate}
        - Designer Name: ${designer}
        - Customer Review: "${review}"
        - Desired Style: ${style}
        
        STYLE-SPECIFIC RULES:
        - "상냥하게" (Sweetly): Use very soft and warm language. Use informal honorifics like "~해요", "~네요", "~신가요?". Use warm emojis (😊, 💕, 🌸). Focus on empathy and a welcoming heart.
        - "정중하게" (Politely): Use professional, standard honorifics. Clean, clear, and grateful. Use polite endings like "~합니다", "~드립니다". Emojis should be minimal and professional (🙏, ✨).
        - "친근하게" (Friendly): Talk like a close regular customer. Use casual honorifics like "~요", "~죠?". Use expressive and friendly emojis (🙌, 👍, 🔥). It should feel like a friendly chat.
        - "장난스럽게" (Playfully): Use wit and humor. High energy. You can be a bit more expressive with exclamations (!!, ??) and fun emojis (🤣, 😎, 💇). Include a light-hearted comment about how great they look.
        - "다나까" (Formal-Danaka): Use high-formality military-style endings (ends in ~다, ~까). Strictly professional and disciplined. NO soft "~요" endings. Very clear and structured.
        
        REQUIREMENTS:
        1. Start the reply EXACTLY with: "안녕하세요 고객님 제니유헤어부티크 ${designer} 입니다."
        2. Tailor the tone strictly to the rules defined in the "STYLE-SPECIFIC RULES" section for the chosen style.
        3. SEASONAL & CONTEXTUAL AWARENESS: Use the current date (${currentDate}) as a reference for the season and weather in Korea. Incorporate natural, human-like seasonal greetings (e.g., "날씨가 많이 따뜻해졌죠?", "초여름 날씨가 시작되었네요") instead of robotically stating the date. Ensure any wellness tips or greetings are 100% appropriate for the current month.
        4. GENDER-APPROPRIATE TONE: If the designer is male (e.g., 원석, 범수, 차니), avoid overly feminine expressions or excessive "cute" emojis (like 💖, ✨). Keep it polite, professional, and kind but grounded.
        5. Acknowledge specific details in the review if any.
        6. Invite the customer to return or express gratitude.
        7. Use varied and appropriate emojis that match the mood and the designer's professional image.
        8. Keep it natural and like a real person wrote it.
        9. Language: Korean.
        10. ORTHOGRAPHY & SPACING: Ensure impeccable Korean orthography and spacing (맞춤법 및 띄어쓰기). Use line breaks (\\n) to separate sentences or paragraphs logically for better readability.
        11. DO NOT include any placeholder text like "[Review Content]" or "[Date]".
        
        Write only the reply text.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Stable model that was working previously
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const reply = result.text.trim();
      res.json({ reply });

    } catch (error: any) {
      console.error("Reply Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
