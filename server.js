const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Importar las funciones (necesitarías convertir de TS a JS o usar ts-node)
const { formatAnthropicToOpenAI } = require('./formatRequest');
const { formatOpenAIToAnthropic } = require('./formatResponse');
const { streamOpenAIToAnthropic } = require('./streamResponse');

app.use(express.json());

// Página principal
app.get('/', (req, res) => {
  res.send(`
    <h1>Claude Code Router</h1>
    <p>Use this URL as your ANTHROPIC_BASE_URL</p>
  `);
});

// Endpoint principal
app.post('/v1/messages', async (req, res) => {
  try {
    const anthropicRequest = req.body;
    const openaiRequest = formatAnthropicToOpenAI(anthropicRequest);
    const bearerToken = req.headers['x-api-key'];

    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const openaiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(openaiRequest),
    });

    if (!openaiResponse.ok) {
      return res.status(openaiResponse.status).send(await openaiResponse.text());
    }

    if (openaiRequest.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Aquí necesitarías adaptar el streaming
      const stream = streamOpenAIToAnthropic(openaiResponse.body, openaiRequest.model);
      stream.pipeTo(res);
    } else {
      const openaiData = await openaiResponse.json();
      const anthropicResponse = formatOpenAIToAnthropic(openaiData, openaiRequest.model);
      res.json(anthropicResponse);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Use http://localhost:${port} as your ANTHROPIC_BASE_URL`);
});