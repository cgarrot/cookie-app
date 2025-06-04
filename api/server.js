const fastify = require('fastify');
const cors = require('@fastify/cors');
const multipart = require('@fastify/multipart');
const { config } = require('dotenv');
const fs = require('fs/promises');
const path = require('path');
const { OpenAI } = require('openai');

config();

const DATA_DIR = path.join(__dirname, 'data');
const MENU_HISTORY_FILE = path.join(DATA_DIR, 'menu-history.json');
const TRAY_SESSIONS_FILE = path.join(DATA_DIR, 'tray-sessions.json');
const CURRENT_MENU_FILE = path.join(DATA_DIR, 'current-menu.json');

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const files = [
    [MENU_HISTORY_FILE, '[]'],
    [TRAY_SESSIONS_FILE, '[]'],
    [CURRENT_MENU_FILE, 'null'],
  ];
  for (const [file, content] of files) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, content);
    }
  }
}

function loadJSON(file) {
  return fs.readFile(file, 'utf8').then((s) => JSON.parse(s));
}

async function saveJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const menuAnalysisPrompt = `Analyze this cookie menu image. I need to extract the structure and cookie types available.\n\nPlease identify:\n1. All cookie types/names visible on the menu\n2. The sections or categories (if the menu is divided into 6 sections as mentioned)\n3. Any specific details about each cookie type\n4. The overall structure and organization of the menu\n\nReturn a detailed JSON structure that I can use as a reference for comparing against tray photos later.\n\nExpected format:\n{\n  "menuStructure": {\n    "sections": [\n      {\n        "sectionName": "Section name",\n        "cookieTypes": [\n          {\n            "name": "Cookie name",\n            "description": "Description if visible",\n            "category": "Category if applicable"\n          }\n        ]\n      }\n    ]\n  },\n  "allCookieTypes": [\n    {\n      "name": "Cookie name",\n      "section": "Which section",\n      "description": "Description"\n    }\n  ],\n  "totalTypes": number,\n  "confidence": number (0-1),\n  "notes": "Any additional observations"\n}`;

const trayAnalysisPrompt = `Analyze this tray/plate of cookies and count them precisely with detailed descriptions.`;

async function analyzeImageWithOpenAI(base64Image, prompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'high' },
          },
        ],
      },
    ],
    max_tokens: 1024,
  });

  const text = response.choices[0].message.content;
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error('Invalid JSON from OpenAI');
  }
}

async function start() {
  await ensureDataFiles();
  const app = fastify();
  await app.register(cors, { origin: true });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  app.post('/api/menu/analyze', async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: 'No image uploaded' });
    const buffer = await data.toBuffer();
    const base64 = buffer.toString('base64');

    let result;
    try {
      result = await analyzeImageWithOpenAI(base64, menuAnalysisPrompt);
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }

    const timestamp = Date.now();
    const menuData = {
      id: timestamp,
      timestamp: new Date().toISOString(),
      imageName: data.filename,
      imageSize: buffer.length,
      version: `v${timestamp}`,
      ...result,
    };

    const history = await loadJSON(MENU_HISTORY_FILE);
    history.push(menuData);
    await saveJSON(MENU_HISTORY_FILE, history);
    await saveJSON(CURRENT_MENU_FILE, menuData);

    reply.send(menuData);
  });

  app.post('/api/tray/analyze', async (req, reply) => {
    const currentMenu = await loadJSON(CURRENT_MENU_FILE);
    if (!currentMenu) {
      return reply.code(400).send({ error: 'No menu reference available' });
    }
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: 'No image uploaded' });
    const buffer = await data.toBuffer();
    const base64 = buffer.toString('base64');

    const cookieDetails = currentMenu.allCookieTypes
      .map((c) => c.name)
      .join(', ');

    const prompt = `${trayAnalysisPrompt}\n\nAvailable cookie types from your menu: ${cookieDetails}`;

    let result;
    try {
      result = await analyzeImageWithOpenAI(base64, prompt);
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }

    const trayData = {
      ...result,
      imageName: data.filename,
      imageSize: buffer.length,
      timestamp: new Date().toISOString(),
      menuReferenceId: currentMenu.id,
      menuVersion: currentMenu.version,
    };

    const sessions = await loadJSON(TRAY_SESSIONS_FILE);
    sessions.push(trayData);
    await saveJSON(TRAY_SESSIONS_FILE, sessions);

    reply.send(trayData);
  });

  app.get('/api/analytics', async (_req, reply) => {
    const sessions = await loadJSON(TRAY_SESSIONS_FILE);
    const menuHistory = await loadJSON(MENU_HISTORY_FILE);
    const today = new Date().toLocaleDateString('fr-FR');

    const todaySessions = sessions.filter((s) => {
      return new Date(s.timestamp).toLocaleDateString('fr-FR') === today;
    });
    const todayStats = {
      sessions: todaySessions.length,
      totalCookies: todaySessions.reduce((sum, s) => sum + (s.totalCount || 0), 0),
      lastSession: todaySessions[todaySessions.length - 1]?.timestamp || null,
    };

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekSessions = sessions.filter((s) => {
      const d = new Date(s.timestamp);
      return d >= weekAgo && d <= now;
    });
    const weeklyStats = {
      sessions: weekSessions.length,
      totalCookies: weekSessions.reduce((sum, s) => sum + (s.totalCount || 0), 0),
    };

    const globalCookieTypes = {};
    sessions.forEach((s) => {
      (s.cookieTypes || []).forEach((t) => {
        globalCookieTypes[t.name] = (globalCookieTypes[t.name] || 0) + t.count;
      });
    });
    const topCookieTypes = Object.entries(globalCookieTypes)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    reply.send({ todayStats, weeklyStats, topCookieTypes, menuHistoryCount: menuHistory.length });
  });

  const PORT = process.env.PORT || 3001;
  app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    console.log(`API server listening on port ${PORT}`);
  });
}

start();
