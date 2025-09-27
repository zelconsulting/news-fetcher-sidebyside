// Import the necessary modules using dynamic import()
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const xml2js = require('xml2js'); // xml2js works with require() so we'll keep it

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const foxNewsRSS = 'http://feeds.foxnews.com/foxnews/latest';
const cnnNewsRSS = 'http://rss.cnn.com/rss/cnn_topstories.rss';

const parser = new xml2js.Parser({ explicitArray: false });

async function getHeadlines(url) {
    try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(url));
        const xmlText = await response.text();
        const result = await parser.parseStringPromise(xmlText);
        const items = result.rss.channel.item || [];
        return items.slice(0, 20).map(item => ({
            title: item.title,
            link: item.link
        }));
    } catch (error) {
        console.error('Error fetching headlines:', error);
        return [];
    }
}

async function generateHeadlinesJson() {
    const foxHeadlines = await getHeadlines(foxNewsRSS);
    const cnnHeadlines = await getHeadlines(cnnNewsRSS);
    
    const data = {
        fox: foxHeadlines,
        cnn: cnnHeadlines,
        timestamp: new Date().toISOString()
    };
    
    const fs = require('fs');
    fs.writeFileSync('headlines.json', JSON.stringify(data, null, 2));
    console.log('Successfully generated headlines.json');
}

generateHeadlinesJson();
