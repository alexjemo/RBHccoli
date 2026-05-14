const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    await page.goto('https://alexjemo.github.io/RBHccoli/', { waitUntil: 'networkidle2' });
    
    console.log("Page loaded. Checking state...");
    const loadingVisible = await page.$eval('#view-loading', el => !el.classList.contains('hidden'));
    console.log("Loading visible:", loadingVisible);
    
    await browser.close();
})();
