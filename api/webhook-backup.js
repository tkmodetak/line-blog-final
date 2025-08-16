module.exports = (req, res) => {
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true, 
      message: 'LINE Webhook endpoint is working',
      time: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    // LINEからのPOSTリクエストには必ず200で応答
    return res.status(200).json({
      success: true,
      message: 'Webhook received',
      timestamp: new Date().toISOString()
    });
  }

  res.status(405).json({error: 'Method not allowed'});
};
