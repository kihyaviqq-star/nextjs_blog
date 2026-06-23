const cheerio = require('cheerio');

async function test() {
  const url = 'https://www.softportal.com/software-49272-bookshelf.html';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log("All image URLs:");
  $('img').each((i, el) => {
    let src = $(el).attr('src') || $(el).attr('data-src');
    if (src) console.log(src);
  });
  
  console.log("\nAll a tags with images inside:");
  $('a:has(img)').each((i, el) => {
    console.log("A href:", $(el).attr('href'), "IMG src:", $(el).find('img').attr('src') || $(el).find('img').attr('data-src'));
  });
}
test();
