const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('scratch/ddg.html', 'utf8');
const $ = cheerio.load(html);
$('a').each((i, el) => {
  const href = $(el).attr('href');
  if (href && href.startsWith('http') && !href.includes('duckduckgo')) {
    console.log(href);
  }
});
