const fs = require('fs');

async function main() {
  try {
    const url = 'https://www.softportal.com/'; 
    console.log(`Fetching ${url}...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    fs.writeFileSync('scratch/softportal_cat.html', html);
    
    console.log(`Saved ${html.length} bytes to scratch/softportal_cat.html`);
    
    // Quick parse to see if we can extract program links
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    
    const programLinks = [];
    $('a[href^="software-"]').each((i, el) => {
      programLinks.push($(el).attr('href'));
    });
    
    console.log(`Found ${programLinks.length} program links. First few:`);
    console.log([...new Set(programLinks)].slice(0, 5));
    
  } catch (err) {
    console.error('Error fetching:', err);
  }
}

main();
