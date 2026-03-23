// ============================================================
// LIGA 4x4 — Telegram Auth Bot
// Деплой: Vercel Serverless Function или Node.js
// ============================================================
// npm install node-telegram-bot-api @supabase/supabase-js

const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

const BOT_TOKEN = '8690305894:AAGOHg-AzQanGc0SBi_w511qxdyIgi6rlac';
const SUPABASE_URL = 'https://umwgqkjfovmbkrrelqvt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtd2dxa2pmb3ZtYmtycmVscXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTkyNzUsImV4cCI6MjA4OTc5NTI3NX0.fi5sozz0uGvncsf6KqJHR99Jroe7B_e5rx_q0fuTAmA';
const APP_URL = 'https://tleaguemamoball.vercel.app';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// /start command
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const param = (match[1] || '').trim();
  const user = msg.from;

  // AUTH FLOW: /start auth_TOKEN
  if (param.startsWith('auth_')) {
    const token = param.replace('auth_', '');

    try {
      // Check token exists and not used
      const { data: tokenRows, error } = await supabase
        .from('auth_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (error || !tokenRows) {
        await bot.sendMessage(chatId,
          '❌ Ссылка недействительна или устарела.\n\nВернись на сайт и попробуй снова.',
          { parse_mode: 'HTML' }
        );
        return;
      }

      // Mark token as used and save user data
      await supabase
        .from('auth_tokens')
        .update({
          used: true,
          telegram_id: user.id,
          telegram_username: user.username || null,
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          photo_url: null // Telegram doesn't expose photo in messages
        })
        .eq('token', token);

      // Send success message with inline button back to app
      await bot.sendMessage(chatId,
        `✅ <b>Авторизация успешна!</b>\n\nДобро пожаловать, <b>${user.first_name || user.username || 'Игрок'}</b>!\n\nНажми кнопку ниже чтобы вернуться в Лигу 4×4 👇`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '⚽ Вернуться в Лигу 4×4',
                url: APP_URL
              }
            ]]
          }
        }
      );

    } catch (err) {
      console.error('Auth error:', err);
      await bot.sendMessage(chatId, '⚠️ Произошла ошибка. Попробуй ещё раз.');
    }

    return;
  }

  // Default /start — no token
  await bot.sendMessage(chatId,
    `👋 <b>Привет, ${user.first_name || 'игрок'}!</b>\n\nЯ бот Лиги 4×4 ⚽\n\nЧерез меня происходит авторизация на сайте лиги.\n\nЧтобы войти — нажми кнопку "Войти через Telegram" на сайте лиги.`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🌐 Открыть сайт Лиги',
            url: APP_URL
          }
        ]]
      }
    }
  );
});

// Handle other messages
bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) return;
  await bot.sendMessage(msg.chat.id,
    '⚽ Для авторизации — нажми кнопку "Войти через Telegram" на сайте лиги.',
    {
      reply_markup: {
        inline_keyboard: [[{ text: '🌐 Открыть сайт', url: APP_URL }]]
      }
    }
  );
});

console.log('🤖 Liga 4x4 Bot started!');

// ============================================================
// ЕСЛИ ИСПОЛЬЗУЕШЬ VERCEL WEBHOOK (вместо polling):
// ============================================================
// Создай файл api/webhook.js:
/*
import TelegramBot from 'node-telegram-bot-api';
const bot = new TelegramBot(process.env.BOT_TOKEN);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await bot.processUpdate(req.body);
    res.status(200).json({ ok: true });
  } else {
    res.status(200).send('Liga Bot OK');
  }
}
*/
