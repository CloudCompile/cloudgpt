const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const providers = [
    {
      name: 'Pollinations',
      url: 'https://enter.pollinations.ai/#models',
      selector: '[data-model-id], .model-name, .model-card',
    },
    {
      name: 'Groq',
      url: 'https://console.groq.com/docs/models',
      selector: '.model-name, [data-model], .api-model',
    },
    {
      name: 'Cerebras',
      url: 'https://cloud.cerebras.ai/docs',
      selector: '.model, [data-model], .model-list',
    },
    {
      name: 'VoidAI',
      url: 'https://voidai.app/#models',
      selector: '.model, [data-model], .model-card',
    },
    {
      name: 'Airforce',
      url: 'https://api.airforce/models',
      selector: '.model, [data-model], .model-card',
    },
    {
      name: 'TokenReply',
      url: 'https://api.tokenreply.com/docs',
      selector: '.model, [data-model], .model-list',
    },
    {
      name: 'NagaAI',
      url: 'https://www.naga.ac/#models',
      selector: '.model, [data-model], .model-card',
    },
    {
      name: 'AIHorde',
      url: 'https://aihorde.net/api/v2/status/models',
      selector: 'body',
    },
    {
      name: 'Happupy',
      url: 'https://beta.hapuppy.com/docs',
      selector: '.model, [data-model], .model-list',
    },
  ];

  for (const provider of providers) {
    try {
      console.log(`\n📍 Checking ${provider.name}...`);
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(10000);
      page.setDefaultTimeout(10000);

      try {
        await page.goto(provider.url, { waitUntil: 'domcontentloaded' });
        const pageTitle = await page.title();
        console.log(`✅ Page loaded: ${pageTitle}`);

        // Try to get page content
        const content = await page.content();
        if (content.length > 100) {
          console.log(`✅ Got ${content.length} bytes of content`);
          // Look for model mentions
          const modelMatches = content.match(/model|free|api|key/gi) || [];
          console.log(`   Found ${modelMatches.length} mentions of model/free/api/key`);
        }
      } catch (navError) {
        console.log(`⚠️ Navigation failed: ${navError.message}`);
      }

      await page.close();
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\n✨ Scan complete');
})();
