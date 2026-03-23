const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://umwgqkjfovmbkrrelqvt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const APP_URL = 'https://tleaguemamoball.vercel.app';
const BOT_TOKEN = '8540944517:AAGbUvbYsrbhgqZpoC-tldq91kS5YC1oYXo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendMessage(chatId, text, keyboard) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: keyboard })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');
  
  const { message } = req.body;
  if (!message) return res.status(200).json({ ok: true });

  const chatId = message.chat.id;
  const text = message.text || '';
  const user = message.from;

  if (text.startsWith('/start auth_')) {
    const token = text.replace('/start auth_', '').trim();
    const { data } = await supabase.from('auth_tokens').select('*').eq('token', token).eq('used', false).single();
    
    if (!data) {
      await sendMessage(chatId, '❌ Ссылка устарела. Вернись на сайт и попробуй снова.');
    } else {
      await supabase.from('auth_tokens').update({
        used: true,
        telegram_id: user.id,
        telegram_username: user.username || null,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
      }).eq('token', token);

      await sendMessage(chatId,
        `✅ <b>Авторизация успешна!</b>\n\nДобро пожаловать, <b>${user.first_name || 'Игрок'}</b>! ⚽`,
        { inline_keyboard: [[{ text: '⚽ Вернуться в Лигу 4×4', url: APP_URL }]] }
      );
    }
  } else {
    await sendMessage(chatId,
      `👋 Привет! Я бот Лиги 4×4.\n\nДля входа нажми "Войти через Telegram" на сайте.`,
      { inline_keyboard: [[{ text: '🌐 Открыть сайт', url: APP_URL }]] }
    );
  }

  res.status(200).json({ ok: true });
}
```

2. Задеплой на Vercel — и один раз зарегистрируй webhook командой в браузере:
```
https://api.telegram.org/bot8690305894:AAGOHg-AzQanGc0SBi_w511qxdyIgi6rlac/setWebhook?url=https://tleaguemamoball.vercel.app/api/webhook
