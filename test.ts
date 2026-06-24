async function test() {
  const res = await fetch('https://www.softportal.com/software-46663-windows-notification-fixer.html', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html = await res.text();
  const m = html.match(/href="([^"]*?\/scr\/[^"]*?)"/g);
  console.log(m ? m.slice(0, 5) : 'None');
}
test();
