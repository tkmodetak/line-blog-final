const axios = require('axios');

module.exports = async (req, res) => {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'おはようございます' : hour < 18 ? 'こんにちは' : 'こんばんは';
  
  const message = greeting + '！今日のニュースをお届けします。';
  
  try {
    // LINEに送信
    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: process.env.LINE_USER_ID,
        messages: [{type: 'text', text: message}]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.LINE_CHANNEL_ACCESS_TOKEN
        }
      }
    );
    
    res.status(200).json({success: true, message: 'Sent'});
  } catch (error) {
    res.status(500).json({success: false, error: error.message});
  }
};
