const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;

exports.getArticles = async (event) => {
    try {
        const params = {
            TableName: tableName,
            Limit: 20,
            ScanIndexForward: false
        };

        const result = await dynamo.scan(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify(result.Items)
        };
    } catch (error) {
        console.error('Error getting articles:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to get articles' })
        };
    }
};

exports.getArticle = async (event) => {
    try {
        const { id } = event.pathParameters;
        const params = {
            TableName: tableName,
            Key: { id }
        };

        const result = await dynamo.get(params).promise();
        if (!result.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Article not found' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(result.Item)
        };
    } catch (error) {
        console.error('Error getting article:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to get article' })
        };
    }
};
