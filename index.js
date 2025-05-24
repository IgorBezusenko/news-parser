// const { Telegraf } = require('telegraf');
// const fetch = require('node-fetch');
// const cheerio = require('cheerio');
// const cron = require('node-cron');

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import {Telegraf} from 'telegraf';
import {formatDate,} from "date-fns";
import {ru} from 'date-fns/locale'
import * as cron from "node-cron";

const YOUR_BOT_TOKEN = ''
const YOUR_CHAT_ID = ""
const bot_1 = new Telegraf(YOUR_BOT_TOKEN); // замени на свой токен

// Парсер Cointelegraph
// async function getCointelegraphNews() {
//     const res = await fetch('https://ru.cointelegraph.com/tags/altcoin');
//     const html = await res.text();
//     const $ = cheerio.load(html);
//
//     const news = [];
//
//     console.log("i//////////",html)
//     // console.log("i//////////",$('.tag-page__title').text().trim())
//     // $('div.tag-page').each((i, el) => {
//     //     console.log("i",i)
//     //     if (i >= 3) return false;
//     //     const title = $(el).text().trim();
//     //     const link = 'https://cointelegraph.com' + $(el).attr('href');
//     //     // news.push(`📰 ${title}\n${link}`);
//     //
//     //     console.log("title", title)
//     //
//     //     const data = {
//     //         // publishedDate: publishedDate,
//     //         title,
//     //         link,
//     //         // description,
//     //     }
//     //
//     //     // if (data.title) {
//     //     //     news.push(data)
//     //     // }
//     //
//     //
//     // });
//
//
//     return news;
// }

// Парсер ProFinance
async function getCoinMarketCup() {
    const res = await fetch('https://coinmarketcap.com/ru/headlines/news/');
    const html = await res.text();
    const $ = cheerio.load(html);
    const news = [];

    $('.infinite-scroll-component').children('div').each((i, el) => {
        if (i >= 4) {
            return false
        }
        const title = $(el).find('a').text().trim();
        const description = $(el).find('p').text().trim().slice(5);
        const link = $(el).find('a').attr('href');
        const log1 = $(el).find('svg').parent().parent().find('p').text().trim();
        const publishedDateTime = $(el).find('p').text().trim().slice(0, 5)
        const publishedDateCurrent = formatDate(new Date(), 'dd MMM yyyy', {locale: ru})
        const publishedDate = publishedDateCurrent && publishedDateTime ? `${publishedDateCurrent} ${publishedDateTime}` : ""

        const data = {
            publishedDate: publishedDate,
            title,
            link,
            description,
        }

        if (data.title) {
            news.push(data)
        }
    });

    return news;
}

// Парсер CryptoNews
async function getCryptoNewsNet() {
    const res = await fetch('https://cryptonews.net/ru/editorial/all-posts/');
    const html = await res.text();
    const $ = cheerio.load(html);
    const news = [];

    $('.news-item').each((i, el) => {
        const publishedDate = $(el).children('.desc').find('.datetime').parent().text().trim().split(",")[0];
        const newsDateDay = publishedDate.split(" ")[0]
        const currentDate = new Date().getDay();
        const title = $(el).children('.desc').children('.title').text().trim();
        const description = $(el).children('.desc').children('.editorial-preview-text').text().trim();
        const link = 'https://cryptonews.net' + $(el).children('.desc').children('.title').attr('href');

        if (newsDateDay !== currentDate.toString()) {
            return false
        }

        if (i >= 3) {
            return false
        }
        const data = {
            publishedDate,
            title,
            link, description
        }

        news.push(data)

    });

    return news;
}

// const resss1 = await getCryptoNewsNet();
// const resss = await getCoinMarketCup();
// const resss = await getCointelegraphNews();
// console.log("resss", resss)
// console.log("resss1", resss1)
//Команда /news
bot_1.command('news', async (ctx) => {
    ctx.reply('Собираю новости, подожди немного...');
    const [
        cryptoNewsNet,
        coinMarketCup,
        // cointelegraphNews,
    ] = await Promise.all([
        getCryptoNewsNet(),
        getCoinMarketCup(),
        // getCointelegraphNews()
    ]);

    ctx.replyWithMarkdown(formatNews([...cryptoNewsNet,
        ...coinMarketCup]), {parse_mode: 'HTML'})
    // ctx.replyWithMarkdown(formatNews(coinMarketCup,), {parse_mode: 'HTML'})
});
const linksTG = `<a href="https://t.me/lazyTradings">Telegram</a> | <a href="https://www.youtube.com/@SYSTEMTRADING_/featured">YouTube</a> | <a href="https://okx.com/join/99552116">OKX</a> | <a href="https://www.bybit.com/invite?ref=LXYQQ6">Bybit</a> | <a href="https://share.bitget.com/u/KKJ0NUVS)">Bitget</a> `
// Автоматическая отправка каждые 6 часов
cron.schedule('0 */6 * * *', async () => {


    const chatId = YOUR_CHAT_ID; // Вставь свой Telegram ID
    const [
        cryptoNewsNet,
        coinMarketCup,
        // cointelegraphNews,
    ] = await Promise.all([
        getCryptoNewsNet(),
        getCoinMarketCup(),
        // getCointelegraphNews()
    ]);


    await bot_1.telegram.sendMessage(chatId, formatNews([...cryptoNewsNet,
        ...coinMarketCup]), {parse_mode: 'HTML'});
    // await bot_1.telegram.sendMessage(chatId, formatNews(coinMarketCup,), {parse_mode: 'HTML'});
    // await bot_1.telegram.sendMessage(chatId, "message", {parse_mode: 'Markdown'});
});

// ${n.publishedDate ? n.publishedDate + '\n\n' : ""}
function formatNews(newsArray, emoji = '📰') {
    return '\n#Новости\n\n' + newsArray
        .map(n =>
            `${emoji}  <b>${n.title}</b>\n${n.description ? n.description : ''} <a href="${n.link}">Источник</a>`
        )
        .join('\n\n') + `\n\n ${linksTG}`;
}

bot_1.launch();
