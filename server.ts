import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function createAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const app = express();
app.use(express.json({ limit: '4mb' }));

app.post('/api/note/draft', async (req, res) => {
  try {
    const ai = createAiClient();
    if (!ai) {
      res.status(403).json({
        error:
          'No Gemini API key is configured in Settings > Secrets. You can write your dedication note directly.',
      });
      return;
    }

    const recipientName =
      typeof req.body?.recipientName === 'string' && req.body.recipientName.trim()
        ? req.body.recipientName.trim()
        : 'my priority';
    const detail =
      typeof req.body?.detail === 'string' && req.body.detail.trim()
        ? req.body.detail.trim()
        : 'her curly hair, the music she loves, and fresh flowers';

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Write a short, genuine, warm 3-sentence note for ${recipientName} to accompany a quiet interactive webpage with a spinning vinyl record, flowers, and a floating silk balloon. Gently weave in ${detail}. Keep it natural, affectionate, understated, and human—never overly formal or cheesy. Output only the note body without greeting or signature.`,
    });

    const draft = response.text?.trim() ?? '';
    if (!draft) {
      res.status(502).json({ error: 'Could not draft a note right now.' });
      return;
    }

    res.json({ draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error drafting note.';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sound & Petals server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
