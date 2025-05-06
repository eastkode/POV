const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;
const s3 = new AWS.S3();
const bucketName = 'odisha-news-sitemap'; // Create this bucket in S3

exports.generateSitemap = async () => {
    try {
        // Get all articles
        const result = await dynamo.scan({
            TableName: tableName,
            Limit: 1000
        }).promise();

        const articles = result.Items;
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${articles.map(article => `
                <url>
                    <loc>https://odisha-news-website.com/article/${article.id}</loc>
                    <lastmod>${new Date(article.createdAt).toISOString()}</lastmod>
                    <changefreq>daily</changefreq>
                    <priority>0.8</priority>
                </url>
            `).join('')}
        </urlset>`;

        // Upload to S3
        await s3.putObject({
            Bucket: bucketName,
            Key: 'sitemap.xml',
            Body: sitemap,
            ContentType: 'application/xml',
            ACL: 'public-read'
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Sitemap generated successfully' })
        };
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate sitemap' })
        };
    }
};

exports.generateNewsSitemap = async () => {
    try {
        // Get all articles
        const result = await dynamo.scan({
            TableName: tableName,
            Limit: 1000
        }).promise();

        const articles = result.Items;
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
            ${articles.map(article => `
                <url>
                    <loc>https://odisha-news-website.com/article/${article.id}</loc>
                    <news:news>
                        <news:publication>
                            <news:name>Odisha News Website</news:name>
                            <news:language>en</news:language>
                        </news:publication>
                        <news:title><![CDATA[${article.title}]]></news:title>
                        <news:publication_date>${new Date(article.createdAt).toISOString()}</news:publication_date>
                        <news:is_based_on>${article.link}</news:is_based_on>
                    </news:news>
                </url>
            `).join('')}
        </urlset>`;

        // Upload to S3
        await s3.putObject({
            Bucket: bucketName,
            Key: 'sitemap-news.xml',
            Body: sitemap,
            ContentType: 'application/xml',
            ACL: 'public-read'
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'News sitemap generated successfully' })
        };
    } catch (error) {
        console.error('Error generating news sitemap:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate news sitemap' })
        };
    }
};
