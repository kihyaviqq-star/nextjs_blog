const cheerio = require('cheerio');

async function test() {
  const url = 'https://www.softportal.com/software-49272-bookshelf.html';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);

  // Logo
  let logoUrl = $('img[itemprop="image"]').attr('src');
  if (!logoUrl) {
    // maybe it's in a different place?
    logoUrl = $('.program-logo img').attr('src');
  }
  
  // Screenshots
  // Usually softportal screenshots are in .screen-block or a with data-fancybox
  let screenshots = [];
  $('a[data-fancybox="gallery"]').each((i, el) => {
    let src = $(el).attr('href');
    if (src && !src.startsWith('http')) src = 'https://www.softportal.com' + src;
    if (src) screenshots.push(src);
  });

  // Alternative screenshot selector
  if (screenshots.length === 0) {
    $('.screens-block img').each((i, el) => {
      let src = $(el).attr('src') || $(el).parent('a').attr('href');
      if (src && !src.startsWith('http')) src = 'https://www.softportal.com' + src;
      if (src) screenshots.push(src);
    });
  }

  // Another alternative
  if (screenshots.length === 0) {
    $('div[id^="screenshots"] a').each((i, el) => {
      let src = $(el).attr('href');
      if (src && !src.startsWith('http')) src = 'https://www.softportal.com' + src;
      if (src) screenshots.push(src);
    });
  }
  
  // Look for .lazyloaded images that might be screenshots
  if (screenshots.length === 0) {
      $('.hide_desktop img').each((i, el) => {
        let src = $(el).attr('src');
        if (src && !src.startsWith('http')) src = 'https://www.softportal.com' + src;
        if (src && src.includes('scr')) screenshots.push(src);
      });
  }

  console.log('Logo:', logoUrl);
  console.log('Screenshots:', screenshots);
}
test();
