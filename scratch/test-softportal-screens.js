const cheerio = require('cheerio');

async function test() {
  const url = 'https://www.softportal.com/software-52241-bookshelf.html';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);

  $('a[href*="/scr/"]').each((i, el) => {
     console.log("Found:", $(el).attr('href'), "Class:", $(el).attr('class'));
  });
}
test();
