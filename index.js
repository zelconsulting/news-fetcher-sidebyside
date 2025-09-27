import fetch from 'node-fetch';
import { Parser } from 'xml2js';
import fs from 'fs';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const foxNewsRSS = 'http://feeds.foxnews.com/foxnews/latest';
const cnnNewsRSS = 'http://rss.cnn.com/rss/cnn_topstories.rss';

const parser = new Parser({ explicitArray: false });

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
    
    fs.writeFileSync('headlines.json', JSON.stringify(data, null, 2));
    console.log('Successfully generated headlines.json');
}

generateHeadlinesJson();
