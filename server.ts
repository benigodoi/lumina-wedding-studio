/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini SDK with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('WARNING: GEMINI_API_KEY environment variable is not defined.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const ai = getGeminiClient();

// API endpoint for AI Smart Wedding Assistant
app.post('/api/gemini/assist', async (req, res) => {
  try {
    const { actionType, groomName, brideName, date, location, services, notes } = req.body;

    let systemPrompt = '';
    let userPrompt = '';

    if (actionType === 'timeline') {
      systemPrompt = `You are an elite wedding coordinator at Lumina Wedding Studio. You are creating a professional, smooth, highly structured timeline outline for the couple's big day. Deliver an inspiring and organized timeline. Only outline realistic times based on standard durations (e.g. preparation, ceremony, sunset shoot, reception). Keep the tone warm, sophisticated, and encouraging. Return a clean, simple markdown bulleted structure.`;
      userPrompt = `Please generate an wedding day timeline outline for ${groomName || 'Groom'} & ${brideName || 'Bride'} scheduled on ${date || 'the wedding date'} at our venue: "${location || 'the venue'}".
      The packages booked are: ${services ? services.join(', ') : 'Photography'}.
      Special Client Requests: "${notes || 'No special requests'}"`;
    } else {
      systemPrompt = `You are a sophisticated concierge and client liaison at Lumina Wedding Studio, Bucharest. Your job is to draft a beautiful, personalized, high-society email proposal or consultation follow-up to the client, welcoming them to Lumina. Keep the text elegant, formal yet warm, and highly professional. Return a clean, copy-ready email layout starting with \"Subject: ...\"`;
      userPrompt = `Draft an elegant welcome and package consultation follow-up email for the couple: ${groomName || 'John'} & ${brideName || 'Jane'}.
      Wedding Date: ${date || 'the future date'}.
      Venue: ${location || 'our premium list'}.
      Services chosen: ${services ? services.join(', ') : 'Photography'}
      Notes/Special conditions: "${notes || 'None'}"`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.75,
      }
    });

    const text = response.text || 'Unable to generate assistant details. Check API setup.';
    res.json({ success: true, text });
  } catch (error: any) {
    console.error('Error in /api/gemini/assist Route:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Server error communicating with Gemini GenAI' 
    });
  }
});

// Serve health status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Vite Middleware Configuration
async function initializeServer() {
  if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_HMR === 'true') {
    // Development Mode with HMR disabled
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV !== 'production') {
    // Normal Dev mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lumina Wedding Studio is online and serving at http://0.0.0.0:${PORT}`);
  });
}

initializeServer().catch(err => {
  console.error('Failed to start server:', err);
});
