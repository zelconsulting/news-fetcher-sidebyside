import fetch from 'node-fetch';
import { Parser } from 'xml2js';
import fs from 'fs';

// Constants for RSS feeds and the CORS proxy
const CORS_PROXY = 'https://corsproxy.io/?';
const foxNewsRSS = 'http://feeds.feedburner.com/FoxNews/Latest';
const foxNewsPoliticsRSS = 'https://moxie.foxnews.com/google-publisher/politics.xml';
const cnnNewsRSS = 'https://edition.cnn.com/services/rss/';
const cnnPoliticsRSS = 'https://rss.app/feeds/ZV5iFmOIc8kONdND.xml';
const newFeed = 'https://rss.app/feeds/6kYSPr4nshuhgT5w.xml'; // Added new feed

// Keywords to filter for politically-charged headlines
const politicalKeywords = [
  "politics", "biden", "trump", "democrats", "republicans", "congress", "senate",
  "house", "policy", "bill", "legislation", "election", "candidate", "voter",
  "government", "constitution", "liberal", "conservative", "socialism", "capitalism",
  "woke", "freedom", "rights", "protest", "climate", "immigration", "social justice",
  "cancel culture", "critical race theory", "crt", "gop", "progressive", " maga",
  "antifa", "patriot", "fake news", "deep state", "socialism", "capitalism", "scandal",
  "extremist", "radical", "narrative", "insurrection", "unprecedented", "partisan"
];

const parser = new Parser({ explicitArray: false });

// Function to check if a headline contains a political keyword
function isIdeological(headline) {
  const normalizedHeadline = headline.title.toLowerCase();
  return politicalKeywords.some(keyword => normalizedHeadline.includes(keyword));
}

// Function to fetch and parse headlines from a single URL
async function fetchHeadlinesFromUrl(url) {
  try {
    const response = await fetch(CORS_PROXY + encodeURIComponent(url));
    if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed from URL: ${url}`);
    }
    const xmlText = await response.text();
    const result = await parser.parseStringPromise(xmlText);
    return result.rss.channel.item || [];
  } catch (error) {
    console.error(`Error fetching or parsing headlines:`, error);
    return [];
  }
}

// Main function to generate the headlines.json file
async function generateHeadlinesJson() {
    // Fetch all headlines from both Fox News feeds
    const foxLatest = await fetchHeadlinesFromUrl(foxNewsRSS);
    const foxPolitics = await fetchHeadlinesFromUrl(foxNewsPoliticsRSS);
    const combinedFoxHeadlines = [...foxLatest, ...foxPolitics];

    // Remove duplicates from the combined list of Fox headlines
    const uniqueFoxHeadlines = [...new Map(combinedFoxHeadlines.map(item => [item.title, item])).values()];

    // Filter and limit the unique list of Fox headlines
    const ideologicalFoxHeadlines = uniqueFoxHeadlines
      .filter(item => isIdeological(item))
      .slice(0, 20)
      .map(item => ({
        title: item.title,
        link: item.link
      }));

    // Fetch all headlines from all CNN feeds
    const cnnLatest = await fetchHeadlinesFromUrl(cnnNewsRSS);
    const cnnPolitics = await fetchHeadlinesFromUrl(cnnPoliticsRSS);
    const newFeedHeadlines = await fetchHeadlinesFromUrl(newFeed); // Fetches from new feed
    const combinedCnnHeadlines = [...cnnLatest, ...cnnPolitics, ...newFeedHeadlines]; // Combines all CNN feeds

    // Remove duplicates from the combined list of CNN headlines
    const uniqueCnnHeadlines = [...new Map(combinedCnnHeadlines.map(item => [item.title, item])).values()];

    // Filter and limit the unique list of CNN headlines
    const ideologicalCnnHeadlines = uniqueCnnHeadlines
      .filter(item => isIdeological(item))
      .slice(0, 20)
      .map(item => ({
        title: item.title,
        link: item.link
      }));

    const data = {
        fox: ideologicalFoxHeadlines,
        cnn: ideologicalCnnHeadlines,
        timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('headlines.json', JSON.stringify(data, null, 2));
    console.log('Successfully generated headlines.json');
}

// Run the main function
generateHeadlinesJson();
