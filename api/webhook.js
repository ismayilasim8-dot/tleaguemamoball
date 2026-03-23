const SUPABASE_URL = 'https://umwgqkjfovmbkrrelqvt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtd2dxa2pmb3ZtYmtycmVscXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTkyNzUsImV4cCI6MjA4OTc5NTI3NX0.fi5sozz0uGvncsf6KqJHR99Jroe7B_e5rx_q0fuTAmA';
const APP_URL = 'https://tleaguemamoball.vercel.app';
const BOT_TOKEN = '8540944517:AAGbUvbYsrbhgqZpoC-tldq91kS5YC1oYXo';

async function supabaseGet(table, query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  return r.json();
}

async function supabaseUpdate(table, query, body) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(body)
  });
}

async function sendMessage(chatId, text, keyboard) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: keyboard ? JSON.stringify(keyboard) : undefined
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  try {
    const { message } = req.body;
    if (!message) return res.status(200).json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text || '';
    const user = message.from;

    if (text.startsWith('/start auth_')) {
      const token = text.replace('/start auth_', '').trim();
      const rows = await supabaseGet('auth_tokens', `token=eq.${token}&used=eq.false`);

      if (!rows || rows.length === 0) {
        await sendMessage(chatId, '❌ Ссылка устарела. Вернись на сайт и попробуй снова.');
      } else {
        await supabaseUpdate('auth_tokens', `token=eq.${token}`, {
          used: true,
          telegram_id: user.id,
          telegram_username: user.username || null,
          first_name: user.first_name || null,
          last_name: user.last_name || null,
        });

        await sendMessage(
          chatId,
          `✅ <b>Авторизация успешна!</b>\n\nДобро пожаловать, <b>${user.first_name || 'Игрок'}</b>! ⚽`,
          { inline_keyboard: [[{ text: '⚽ Вернуться в Лигу 4×4', url: APP_URL }]] }
        );
      }
    } else {
      await sendMessage(
        chatId,
        `👋 Привет! Я бот Лиги 4×4.\n\nДля входа нажми "Войти через Telegram" на сайте.`,
        { inline_keyboard: [[{ text: '🌐 Открыть сайт', url: APP_URL }]] }
      );
    }
  } catch (e) {
    console.error(e);
  }

  return res.status(200).json({ ok: true });
}
