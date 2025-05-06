#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
echo -e "${YELLOW}Checking AWS CLI installation...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is logged in to AWS
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Not logged in to AWS. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get current region
REGION=$(aws configure get region)
if [ -z "$REGION" ]; then
    echo -e "${RED}AWS region not configured. Please set it using 'aws configure'.${NC}"
    exit 1
fi

# Create CloudFormation stack
echo -e "${YELLOW}Creating CloudFormation stack...${NC}"
aws cloudformation create-stack \
    --stack-name odisha-news-website \
    --template-body file://infrastructure.yaml \
    --parameters \
        ParameterKey=InstanceType,ParameterValue=t2.micro \
        ParameterKey=KeyName,ParameterValue=odisha-news-key \
        ParameterKey=VpcId,ParameterValue=vpc-xxxxxxxx \
        ParameterKey=SubnetId,ParameterValue=subnet-xxxxxxxx \
        ParameterKey=SSHAccessCIDR,ParameterValue=YOUR_IP/32 \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

# Wait for stack creation
echo -e "${YELLOW}Waiting for stack creation to complete...${NC}"
aws cloudformation wait stack-create-complete --stack-name odisha-news-website --region $REGION

echo -e "${GREEN}Stack creation complete!${NC}"

# Get output values
OUTPUTS=$(aws cloudformation describe-stacks --stack-name odisha-news-website --region $REGION --query 'Stacks[0].Outputs' --output json)

WEBSITE_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey == "WebsiteURL") | .OutputValue')
CLOUDFRONT_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey == "CloudFrontURL") | .OutputValue')
INSTANCE_IP=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey == "InstancePublicIP") | .OutputValue')

# Print summary
echo -e "${GREEN}Deployment Summary:${NC}"
echo "Website URL: $WEBSITE_URL"
echo "CloudFront URL: $CLOUDFRONT_URL"
echo "Instance IP: $INSTANCE_IP"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. SSH into the instance: ssh -i odisha-news-key.pem ec2-user@$INSTANCE_IP"
echo "2. Run the EC2 setup script: sudo bash ec2-setup.sh"
echo "3. Update the security group with your IP: YOUR_IP/32"

echo -e "\n${GREEN}Deployment complete!${NC}"
