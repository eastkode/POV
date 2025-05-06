#!/bin/bash

# Exit on any error
set -e

# Get the directory of the script
cd "$(dirname "$0")"

# Read JWT secret
JWT_SECRET=$(cat jwt_secret.txt)

# Create .env file
cat > .env << EOF
# DeepSeek API Configuration
DEEPSEEK_API_KEY=sk-2d2f884a1fd34a8397fc3700e1d455d2

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

# AWS Configuration
AWS_REGION=ap-south-1

# DynamoDB Configuration
DYNAMODB_TABLE=odisha-news-articles

# S3 Configuration
S3_BUCKET=odisha-news-sitemap

# API Configuration
API_BASE_URL=https://odisha-news-api.com/api
EOF

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

# Deploy to AWS
echo "Deploying to AWS..."
npm run deploy

# Create CloudFront distribution
echo "Creating CloudFront distribution..."
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json

# Create S3 bucket for static files
echo "Creating S3 bucket for static files..."
aws s3 mb s3://odisha-news-static

# Upload static files
echo "Uploading static files..."
aws s3 sync ./dist s3://odisha-news-static/

# Set up CloudWatch alarms
echo "Setting up CloudWatch alarms..."
aws cloudwatch put-metric-alarm --cli-input-json file://cloudwatch-alarms.json

# Set up Lambda function environment variables
echo "Setting up Lambda environment variables..."
aws lambda update-function-configuration \
    --function-name odisha-news-backend \
    --environment Variables={
        DEEPSEEK_API_KEY="sk-2d2f884a1fd34a8397fc3700e1d455d2",
        JWT_SECRET="${JWT_SECRET}",
        DYNAMODB_TABLE="odisha-news-articles",
        S3_BUCKET="odisha-news-sitemap"
    }

# Set up CloudFront invalidation
echo "Creating CloudFront invalidation..."
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths '/*'

# Print deployment summary
echo "Deployment completed successfully!"
echo "API URL: https://api.odisha-news.com"
echo "Website URL: https://odisha-news.com"
echo "Admin Panel URL: https://admin.odisha-news.com"
