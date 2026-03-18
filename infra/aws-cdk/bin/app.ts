#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { IamStack } from '../lib/iam-stack';
import { EcsStack } from '../lib/ecs-stack';
import { CdnStack } from '../lib/cdn-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Network stack - VPC, subnets, security groups
const networkStack = new NetworkStack(app, 'NetworkStack', {
  env,
  description: 'VPC, subnets, and security groups for the application',
});

// Database stack - RDS MySQL
const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env,
  vpc: networkStack.vpc,
  description: 'RDS MySQL database with Multi-AZ',
});

// IAM stack - Roles and policies
const iamStack = new IamStack(app, 'IamStack', {
  env,
  description: 'IAM roles and policies for ECS services',
});

// ECS stack - Fargate cluster and services
const ecsStack = new EcsStack(app, 'EcsStack', {
  env,
  vpc: networkStack.vpc,
  database: databaseStack.database,
  executionRole: iamStack.executionRole,
  taskRole: iamStack.taskRole,
  description: 'ECS Fargate cluster and microservices',
});

// CDN stack - CloudFront + S3 for frontend
const cdnStack = new CdnStack(app, 'CdnStack', {
  env,
  description: 'CloudFront CDN and S3 bucket for frontend static hosting',
});

// Stack dependencies
databaseStack.addDependency(networkStack);
iamStack.addDependency(networkStack);
ecsStack.addDependency(networkStack);
ecsStack.addDependency(databaseStack);
ecsStack.addDependency(iamStack);
cdnStack.addDependency(ecsStack);

app.synth();
