const cheerio = require('cheerio');

async function main() {
  const query = "Bookshelf software official site";
  const url = `https://lite.duckduckgo.com/lite/`;
  console.log(`Searching: ${url} for ${query}`);
  
  const formData = new URLSearchParams();
  formData.append('q', query);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'https://lite.duckduckgo.com',
      'Referer': 'https://lite.duckduckgo.com/'
    }
  });
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const results = [];
  $('a.result-url').each((i, el) => {
    results.push($(el).attr('href'));
  });
  
  console.log("Found links:", results.slice(0, 5));
}
main();
