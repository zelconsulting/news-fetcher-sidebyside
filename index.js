import fetch from 'node-fetch';
import { Parser } from 'xml2js';
import fs from 'fs';

// Constants for RSS feeds and the CORS proxy
const CORS_PROXY = 'https://corsproxy.io/?';
const foxNewsRSS = 'http://feeds.feedburner.com/FoxNews/Latest';
const cnnNewsRSS = 'http://rss.cnn.com/rss/cnn_topstories.rss';

// Keywords to filter for politically-charged headlines
const politicalKeywords = [
  "politics", "biden", "trump", "democrats", "republicans", "congress", "senate",
  "house", "policy", "bill", "legislation", "election", "candidate", "voter",
  "government", "constitution", "liberal", "conservative", "socialism", "capitalism",
  "woke", "freedom", "rights", "protest", "climate", "immigration"
];

const parser = new Parser({ explicitArray: false });

// Function to check if a headline contains a political keyword
function isIdeological(headline) {
  const normalizedHeadline = headline.title.toLowerCase();
  return politicalKeywords.some(keyword => normalizedHeadline.includes(keyword));
}

// Function to fetch and parse headlines from a given URL
async function getHeadlines(url, source) {
  try {
    const response = await fetch(CORS_PROXY + encodeURIComponent(url));
    if (!response.ok) {
        throw new Error(`Failed to fetch ${source} RSS feed: ${response.statusText}`);
    }
    const xmlText = await response.text();
    const result = await parser.parseStringPromise(xmlText);
    const allItems = result.rss.channel.item || [];
    
    // Filter the items to only include ideological headlines
    const ideologicalItems = allItems.filter(item => isIdeological(item));
    
    // Return only the top 20 ideological items
    return ideologicalItems.slice(0, 20).map(item => ({
      title: item.title,
      link: item.link
    }));
  } catch (error) {
    console.error(`Error fetching or parsing headlines for ${source}:`, error);
    return [];
  }
}

// Main function to generate the headlines.json file
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

// Run the main function
generateHeadlinesJson();
