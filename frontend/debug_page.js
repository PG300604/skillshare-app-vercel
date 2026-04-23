const puppeteer = require('puppeteer');
(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  console.log("Navigating to localhost:5174...");
  await page.goto('http://localhost:5174');
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
