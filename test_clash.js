const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    let appjs = fs.readFileSync('js/app.js', 'utf8');
    await page.setContent(`
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        <script>
            ${appjs}
        </script>
    `, { waitUntil: 'networkidle0' });
    
    await browser.close();
})();
