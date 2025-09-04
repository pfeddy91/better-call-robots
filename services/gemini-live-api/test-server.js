const express = require('express');
const app = express();
const port = 8082;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      version: '1.0.0'
    }
  });
});

app.post('/api/test/create-audio-session', (req, res) => {
  res.json({
    success: true,
    sessionId: 'test-session-' + Date.now(),
    callSid: 'test-call-' + Date.now(),
    message: 'Test audio session created'
  });
});

app.post('/api/test/send-audio', (req, res) => {
  const { sessionId, audioData } = req.body;
  res.json({
    success: true,
    sessionId,
    audioDataLength: audioData ? audioData.length : 0,
    message: 'Audio data received'
  });
});

app.listen(port, () => {
  console.log(`Test server running on http://localhost:${port}`);
});
