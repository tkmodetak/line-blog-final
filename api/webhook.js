const { Anthropic } = require('@anthropic-ai/sdk');
const axios = require('axios');

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY?.replace(/\s+/g, ''),
});

async function generateBlog(topic) {
  try {
    console.log('Blog generation started for:', topic);
    const prompt = `「${topic}」についてのブログ記事を日本語で作成してください。キャッチーなタイトル、導入文、本文、まとめの構成でお願いします。`;
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error.message);
    return `エラーが発生しました: ${error.message}`;
  }
}

async function replyToLine(replyToken, message) {
  try {
    const cleanToken = LINE_CHANNEL_ACCESS_TOKEN?.replace(/\s+/g, '');
    await axios.post('https://api.line.me/v2/bot/message/reply', {
      replyToken: replyToken,
      messages: [{ type: 'text', text: message }]
    }, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Reply sent successfully');
  } catch (error) {
    console.error('LINE reply error:', error.message);
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'LINE Blog Generator with Claude AI',
      features: ['Blog Generation', 'Claude AI'],
      time: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    try {
      const events = req.body?.events || [];
      
      for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
          const text = event.message.text;
          const replyToken = event.replyToken;
          
          const blogContent = await generateBlog(text);
          const reply = `🎉 ブログ記事を生成しました！\n\nテーマ: ${text}\n\n${blogContent.substring(0, 400)}...`;
          
          await replyToLine(replyToken, reply);
        }
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(200).json({ success: true });
    }
  }

  res.status(405).json({error: 'Method not allowed'});
};
