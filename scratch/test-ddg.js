const cheerio = require('cheerio');

async function main() {
  const query = "Bookshelf software official site";
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  console.log(`Searching: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const results = [];
  $('a.result__url').each((i, el) => {
    results.push($(el).attr('href'));
  });
  
  console.log("Found links:", results.slice(0, 5));
}
main();
