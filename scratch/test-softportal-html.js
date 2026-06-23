async function test() {
  const url = 'https://www.softportal.com/software-49272-bookshelf.html';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
  const html = await res.text();
  console.log(html.substring(0, 1000));
}
test();
