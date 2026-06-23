const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('scratch/softportal_prog.html', 'utf-8');
const $ = cheerio.load(html);

const name = $('h1').text().trim();
const shortDesc = $('meta[name="description"]').attr('content');
const description = $('div[itemprop="description"]').text().trim() || $('.software-description').text().trim() || $('.description').text().trim() || $('p').eq(0).text().trim();
const logo = $('img[itemprop="image"]').attr('src') || $('.software-logo img').attr('src');
const license = $('div:contains("Лицензия:")').next().text().trim() || 'Unknown';
const platform = $('div:contains("ОС:")').next().text().trim() || 'Windows';

console.log('--- EXTRACTED DATA ---');
console.log('Name:', name);
console.log('ShortDesc:', shortDesc);
console.log('Description Length:', description.length);
console.log('Logo:', logo);
console.log('License:', license);
console.log('Platform:', platform);
