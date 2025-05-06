const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tableName = process.env.DYNAMODB_TABLE;

exports.authenticate = async (event) => {
    try {
        const { username, password } = JSON.parse(event.body);

        // Get user from DynamoDB
        const result = await dynamo.get({
            TableName: tableName,
            Key: { username }
        }).promise();

        if (!result.Item) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid credentials' })
            };
        }

        // Verify password
        const isValid = await bcrypt.compare(password, result.Item.password);
        if (!isValid) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid credentials' })
            };
        }

        // Generate JWT token
        const token = jwt.sign({
            username: result.Item.username,
            role: result.Item.role
        }, process.env.JWT_SECRET, { expiresIn: '24h' });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({ token })
        };
    } catch (error) {
        console.error('Error in authentication:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Authentication failed' })
        };
    }
};
