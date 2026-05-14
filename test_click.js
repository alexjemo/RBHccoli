const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    await page.goto('https://alexjemo.github.io/RBHccoli/', { waitUntil: 'networkidle2' });
    
    console.log("Waiting for event cards...");
    await page.waitForSelector('.event-card', { timeout: 10000 });
    
    console.log("Clicking the first event card...");
    await page.click('.event-card');
    
    console.log("Waiting a bit...");
    await new Promise(r => setTimeout(r, 1000));
    
    const isRegisterVisible = await page.$eval('#view-register', el => !el.classList.contains('hidden'));
    console.log("Is view-register visible?", isRegisterVisible);
    
    await browser.close();
})();
