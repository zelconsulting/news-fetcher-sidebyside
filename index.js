import fetch from 'node-fetch';
import { Parser } from 'xml2js';
import fs from 'fs';

const CORS_PROXY = 'https://corsproxy.io/?';
const foxNewsRSS = 'http://feeds.foxnews.com/foxnews/latest';
const cnnNewsRSS = 'http://rss.cnn.com/rss/cnn_topstories.rss';

const parser = new Parser({ explicitArray: false });

async function getHeadlines(url, source) {
    try {
        console.log(`Attempting to fetch headlines from: ${source}`);
        const response = await fetch(CORS_PROXY + encodeURIComponent(url));
        console.log(`Fetch for ${source} successful. Status: ${response.status}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${source} RSS feed: ${response.statusText}`);
        }
        const xmlText = await response.text();
        console.log(`Received XML content for ${source}.`);
        const result = await parser.parseStringPromise(xmlText);
        const items = result.rss.channel.item || [];
        console.log(`Parsed ${items.length} items for ${source}.`);
        return items.slice(0, 20).map(item => ({
            title: item.title,
            link: item.link
        }));
    } catch (error) {
        console.error(`Error fetching or parsing headlines for ${source}:`, error);
        return [];
    }
}

async function generateHeadlinesJson() {
    const foxHeadlines = await getHeadlines(foxNewsRSS, 'Fox News');
    const cnnHeadlines = await getHeadlines(cnnNewsRSS, 'CNN');
    
    const data = {
        fox: foxHeadlines,
        cnn: cnnHeadlines,
        timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('headlines.json', JSON.stringify(data, null, 2));
    console.log('Successfully generated headlines.json');
}

generateHeadlinesJson();
