const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('scratch/softportal_prog.html', 'utf-8');
const $ = cheerio.load(html);

console.log("Looking for developer website links...");

// SoftPortal usually puts the developer site in a specific place
$('div, span, a').each((i, el) => {
  const text = $(el).text();
  if (text.includes('сайт') || text.includes('Разработчик')) {
    if ($(el).is('a')) {
      console.log('Found link:', text.trim(), $(el).attr('href'));
    } else {
      const links = $(el).find('a');
      if (links.length > 0) {
        links.each((j, a) => {
          console.log('Found link inside element:', $(el).text().substring(0, 50).trim(), $(a).attr('href'));
        });
      }
    }
  }
});
