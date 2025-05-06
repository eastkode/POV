const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;

exports.updateSEO = async () => {
    try {
        // Get all articles
        const result = await dynamo.scan({
            TableName: tableName,
            Limit: 1000
        }).promise();

        const articles = result.Items;
        
        for (const article of articles) {
            try {
                // Generate SEO metadata
                const seoData = await generateSEOMetadata(article);

                // Update article in DynamoDB
                await dynamo.update({
                    TableName: tableName,
                    Key: { id: article.id },
                    UpdateExpression: 'SET seo = :s',
                    ExpressionAttributeValues: {
                        ':s': seoData
                    }
                }).promise();
            } catch (error) {
                console.error(`Error updating SEO for article ${article.id}:`, error);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'SEO updates completed' })
        };
    } catch (error) {
        console.error('Error in updateSEO:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to update SEO' })
        };
    }
};

async function generateSEOMetadata(article) {
    // Generate optimized title (max 60 chars)
    const title = `${article.title.substring(0, 50)}... - Odisha News`;
    
    // Generate meta description (max 155 chars)
    const description = article.description ? 
        article.description.substring(0, 150) + '...' :
        `${article.title.substring(0, 100)} - Latest Odisha news and updates`;

    // Generate keywords
    const keywords = [
        'Odisha news',
        'Western Odisha',
        article.category || 'Odisha'
    ].join(', ');

    // Generate structured data
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        datePublished: new Date(article.createdAt).toISOString(),
        author: {
            '@type': 'Person',
            name: article.author || 'Odisha News'
        },
        publisher: {
            '@type': 'Organization',
            name: 'Odisha News Website'
        },
        image: article.mainImage || 'https://odisha-news-website.com/images/default-thumbnail.jpg'
    };

    return {
        title,
        description,
        keywords,
        structuredData
    };
}
