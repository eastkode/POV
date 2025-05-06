const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;
const axios = require('axios');
const cheerio = require('cheerio');

const RSS_FEEDS = [
    'https://odishatv.in/feed/',
    'https://odishabytes.com/feed/',
    'https://dharitri.com/feed/',
    'https://odishanewsonline.com/feed/',
    'https://www.thehindu.com/odisha/odisha-news/feed/',
    'https://www.newindianexpress.com/states/odisha/feed'
];

exports.scrapeNews = async () => {
    try {
        const promises = RSS_FEEDS.map(async (feed) => {
            const response = await axios.get(feed);
            const $ = cheerio.load(response.data);
            
            $('item').each(async (index, element) => {
                const title = $(element).find('title').text();
                const link = $(element).find('link').text();
                const pubDate = $(element).find('pubDate').text();
                const description = $(element).find('description').text();
                
                // Check if article already exists
                const existing = await dynamo.get({
                    TableName: tableName,
                    Key: { link }
                }).promise();

                if (!existing.Item) {
                    // Create new article
                    const article = {
                        id: Date.now().toString(),
                        link,
                        title,
                        pubDate,
                        description,
                        source: feed,
                        createdAt: Date.now(),
                        ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
                    };

                    await dynamo.put({
                        TableName: tableName,
                        Item: article
                    }).promise();
                }
            });
        });

        await Promise.all(promises);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Scraping completed successfully' })
        };
    } catch (error) {
        console.error('Error scraping news:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to scrape news' })
        };
    }
};
