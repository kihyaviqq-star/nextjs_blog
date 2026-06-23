const fs = require('fs');

async function main() {
  try {
    const url = 'https://www.softportal.com/software-52241-bookshelf.html';
    console.log(`Fetching ${url}...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const html = await response.text();
    fs.writeFileSync('scratch/softportal_prog.html', html);
    console.log(`Saved ${html.length} bytes to scratch/softportal_prog.html`);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
