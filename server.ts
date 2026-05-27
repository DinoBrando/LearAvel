import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini API to prevent crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY not configured. Use the Secrets panel to add it.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// AI Laravel Tutor Chat Endpoint
app.post("/api/laravel/chat", async (req, res) => {
  try {
    const { messages, currentModel } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const sysInstruction = `You are an expert, friendly Laravel Core Framework Mentor.
Your mission is to help the student learn the Laravel framework step-by-step.
Keep explanations visual, professional, objective, and highly comparative to Javascript/Node.js concepts when applicable (e.g., comparing Eloquent to Prisma/Sequelize, Blade to JSX/EJS, web.php routes to Express routing, Artisan to npm scripts).
Write clean, annotated, modern Laravel 11 PHP code blocks. Let students know which files their queries belong to (e.g. app/Models/*, resources/views/*).
Current Virtual Model being explored by student: ${JSON.stringify(currentModel || {})}
Focus purely on helping them master CRUD structures, databases, routes, controllers, middleware, authentication, and layouts. Keep responses structured, concise, and scannable.`;

    try {
      const client = getGeminiClient();
      
      // Map requests formatting
      const contents = messages.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: sysInstruction,
        }
      });

      const responseText = response.text || "I was unable to compile an explanation. Could you please rephrase?";
      return res.json({ reply: responseText });

    } catch (apiError: any) {
      console.warn("Gemini API error or missing secret key:", apiError.message);
      
      // Educational fallback responses to guide the student beautifully if API key is not linked yet
      const lastUserMessage = messages[messages.length - 1]?.content || "";
      let fallbackText = `### Laravel Coach Response 💡\n\n*Note: To enable custom dynamic AI training queries, configure your **GEMINI_API_KEY** under Settings > Secrets. Until then, here is a helpful lesson guide for you!*\n\n`;
      
      if (lastUserMessage.toLowerCase().includes("middleware")) {
        fallbackText += `In Laravel, **Middleware** acts as a middle-tier gatekeeper filtering incoming requests. It is comparable to Express middlewares like \`passport.js\` or CORS handlers.\n\nTo define a middleware:\n\`\`\`bash\nphp artisan make:middleware EnsureUserIsAdmin\n\`\`\`\n\nInside \`app/Http/Middleware/EnsureUserIsAdmin.php\`:\n\`\`\`php\npublic function handle(Request $request, Closure $next)\n{\n    if (! $request->user()->is_admin) {\n        return redirect()->route('home')->with('error', 'Unauthorized access.');\n    }\n    return $next($request);\n}\n\`\`\`\nTo use it, register item in \`bootstrap/app.php\` and append Route parameters like \`->middleware('auth')\` inside \`web.php\`.`;
      } else if (lastUserMessage.toLowerCase().includes("relationship") || lastUserMessage.toLowerCase().includes("relation")) {
        fallbackText += `Eloquent handles DB tables join relationships beautifully with standard properties:\n\n1. **One-to-Many**: A \`Post\` has many \`Comments\`.\n\`\`\`php\n// app/Models/Post.php\npublic function comments()\n{\n    return $this->hasMany(Comment::class);\n}\n\`\`\`\n\n2. **Inverse BelongsTo**:\n\`\`\`php\n// app/Models/Comment.php\npublic function post()\n{\n    return $this->belongsTo(Post::class);\n}\n\`\`\`\nYou can query this elegantly with: \`$post = Post::with('comments')->first();\``;
      } else {
        fallbackText += `Laravel organizes backend code using elegant practices. Here's a brief breakdown of core files:\n\n*   **\`routes/web.php\`**: Mapped routing endpoints.
*   **\`app/Models/\`**: Database Active Record bindings with casting, validation, and structures.
*   **\`app/Http/Controllers/\`**: Orchestrator containing views rendering or redirect triggers.
*   **\`resources/views/\`**: HTML compiled via Laravel Blade parser.

Please ask me about specific Laravel topics (like "Eloquent Relationships", "Middleware Filters", "Blade syntax", or "Validation Rules") and I will detail them!`;
      }
      
      return res.json({ reply: fallbackText });
    }

  } catch (err: any) {
    res.status(500).json({ error: err.message || "Something went wrong on the server." });
  }
});

// Configure Vite middleware or Static files serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Laravel Learning app listening on http://localhost:${PORT}`);
  });
}

startServer();
