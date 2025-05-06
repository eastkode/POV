const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;
const axios = require('axios');

exports.rewriteContent = async () => {
    try {
        // Get articles that need rewriting
        const result = await dynamo.scan({
            TableName: tableName,
            FilterExpression: 'attribute_not_exists(processed)'
        }).promise();

        const articles = result.Items;
        
        for (const article of articles) {
            try {
                // Fetch full article content
                const response = await axios.get(article.link);
                const content = response.data;

                // Process with DeepSeek (using cached response if available)
                const processedContent = await processWithDeepSeek(content);

                // Update article in DynamoDB
                await dynamo.update({
                    TableName: tableName,
                    Key: { id: article.id },
                    UpdateExpression: 'SET processed = :p, rewrittenContent = :c',
                    ExpressionAttributeValues: {
                        ':p': true,
                        ':c': processedContent
                    }
                }).promise();
            } catch (error) {
                console.error(`Error processing article ${article.id}:`, error);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Content rewriting completed' })
        };
    } catch (error) {
        console.error('Error in rewriteContent:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to rewrite content' })
        };
    }
};

async function processWithDeepSeek(content) {
    try {
        const response = await axios.post('https://api.deepseek.com/v1/completions', {
            model: 'deepseek-coder',
            prompt: `Rewrite this Odisha news article with professional analysis. Focus on:
            1. Local context and impact
            2. Government's response
            3. Community reactions
            4. Future implications
            
            Original Content:
            ${content.substring(0, 1000)}
            
            Rewritten Content:`,
            max_tokens: 2000,
            temperature: 0.7,
            top_p: 0.9
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error('Error processing with DeepSeek:', error);
        return content; // Return original content if processing fails
    }
}
