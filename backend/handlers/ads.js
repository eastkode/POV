const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;

exports.manageAds = async (event) => {
    try {
        // Verify authentication
        const authHeader = event.headers.Authorization;
        if (!authHeader) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        const { adType, content, placement, status } = JSON.parse(event.body);

        // Generate ad ID
        const adId = Date.now().toString();

        // Create ad object
        const ad = {
            id: adId,
            adType,
            content,
            placement,
            status,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
        };

        // Save to DynamoDB
        await dynamo.put({
            TableName: tableName,
            Item: ad
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Ad created successfully', adId })
        };
    } catch (error) {
        console.error('Error managing ads:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to manage ads' })
        };
    }
};
