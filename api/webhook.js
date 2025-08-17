import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// 文章を複数に分割する関数
function splitMessage(text, maxLength = 4500) {
  const parts = [];
  let current = '';
  const paragraphs = text.split('\n\n');
  
  for (const paragraph of paragraphs) {
    if (current.length + paragraph.length + 2 <= maxLength) {
      current += (current ? '\n\n' : '') + paragraph;
    } else {
      if (current) {
        parts.push(current);
        current = paragraph;
      } else {
        // 段落が長すぎる場合は強制分割
        parts.push(paragraph.substring(0, maxLength));
        current = paragraph.substring(maxLength);
      }
    }
  }
  
  if (current) {
    parts.push(current);
  }
  
  return parts;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'Blog Generator v3.0 - Split Message Version!',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { events } = req.body;
    
    if (!events || events.length === 0) {
      return res.status(200).json({ message: 'No events' });
    }

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        // Claude AIに長文ブログ記事生成を依頼
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `「${userMessage}」について、非常に詳細で長いブログ記事を作成してください。

要件：
- 3000文字以上の長文記事
- 導入、本文（複数章）、まとめの構成
- 具体例や体験談を豊富に含む
- 読者が行動したくなる内容
- 見出しと小見出しを使った読みやすい構成

長い記事を書いてください。短くしないでください。`
          }]
        });

        let blogContent = response.content[0].text;
        
        // 文章を複数のメッセージに分割
        const messageParts = splitMessage(blogContent);
        
        console.log(`📊 Total length: ${blogContent.length} chars, Split into: ${messageParts.length} messages`);
        
        // 最初のメッセージで返信、残りはpush
        const messages = messageParts.map((part, index) => {
          if (index === 0) {
            return {
              type: 'text',
              text: `🎯 長文ブログ記事生成完了！\n📄 全${messageParts.length}部構成 (${blogContent.length}文字)\n\n【第${index + 1}部】\n${part}`
            };
          } else if (index === messageParts.length - 1) {
            return {
              type: 'text',
              text: `【第${index + 1}部 - 完結】\n${part}\n\n✅ 記事完成！\n📊 総文字数：${blogContent.length}文字`
            };
          } else {
            return {
              type: 'text',
              text: `【第${index + 1}部】\n${part}`
            };
          }
        });

        // 最初のメッセージのみreplyで送信
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            replyToken: replyToken,
            messages: [messages[0]]
          })
        });

        // 残りのメッセージはpushで送信（少し間隔を空けて）
        if (messages.length > 1) {
          for (let i = 1; i < messages.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
            
            await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
              },
              body: JSON.stringify({
                to: event.source.userId,
                messages: [messages[i]]
              })
            });
          }
        }
      }
    }

    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}