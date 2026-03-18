# AWS Interview Notes

## Core Services

### Compute Services
- **EC2**: Virtual servers in the cloud
- **ECS**: Container orchestration service
- **EKS**: Managed Kubernetes service
- **Lambda**: Serverless compute functions
- **Elastic Beanstalk**: Platform as a Service

```yaml
# ECS Task Definition example
{
  "family": "web-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "web-app",
      "image": "nginx:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/web-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Storage Services
- **S3**: Object storage for any data
- **EBS**: Block storage for EC2
- **EFS**: File storage for multiple EC2 instances
- **Glacier**: Long-term archival storage
- **CloudFront**: Content delivery network

```javascript
// S3 SDK example
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function uploadFile(bucketName, key, body) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: 'application/json',
    ServerSideEncryption: 'AES256',
    Metadata: {
      'uploaded-by': 'application'
    }
  };
  
  return s3.upload(params).promise();
}

async function getFile(bucketName, key) {
  const params = {
    Bucket: bucketName,
    Key: key
  };
  
  return s3.getObject(params).promise();
}

// Presigned URL for direct upload
function getUploadUrl(bucketName, key, expiresIn = 3600) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: key,
    Expires: expiresIn,
    ContentType: 'application/octet-stream'
  });
}
```

### Database Services
- **RDS**: Relational database service
- **DynamoDB**: NoSQL database
- **Aurora**: MySQL/PostgreSQL compatible
- **ElastiCache**: In-memory cache
- **Redshift**: Data warehouse

```javascript
// DynamoDB SDK example
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const tableName = 'users';

async function createUser(user) {
  const params = {
    TableName: tableName,
    Item: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: new Date().toISOString()
    },
    ConditionExpression: 'attribute_not_exists(id)'
  };
  
  return dynamodb.put(params).promise();
}

async function getUser(userId) {
  const params = {
    TableName: tableName,
    Key: { id: userId }
  };
  
  const result = await dynamodb.get(params).promise();
  return result.Item;
}

async function queryUsersByEmail(email) {
  const params = {
    TableName: tableName,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email
    }
  };
  
  const result = await dynamodb.query(params).promise();
  return result.Items;
}
```

## Networking

### VPC (Virtual Private Cloud)
```yaml
# CloudFormation VPC template
AWSTemplateFormatVersion: '2010-09-09'
Description: 'VPC with public and private subnets'

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: main-vpc

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: main-igw

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: public-subnet-1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: public-subnet-2

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: private-subnet-1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: private-subnet-2

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: public-rt

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable
```

### Load Balancing
```yaml
# Application Load Balancer
Resources:
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: app-load-balancer
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: app-target-group
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: '200'

  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref LoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
```

## Security

### IAM (Identity and Access Management)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": ["203.0.113.0/24"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::my-bucket"
    }
  ]
}
```

### Security Groups
```yaml
Resources:
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 203.0.113.0/24
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
```

## Serverless

### AWS Lambda
```javascript
// Lambda function example
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  try {
    const { httpMethod, path, body } = event;
    
    switch (httpMethod) {
      case 'GET':
        if (path === '/users') {
          return await getUsers();
        } else if (path.startsWith('/users/')) {
          const userId = path.split('/')[2];
          return await getUser(userId);
        }
        break;
        
      case 'POST':
        if (path === '/users') {
          const userData = JSON.parse(body);
          return await createUser(userData);
        }
        break;
        
      default:
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Not Found' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
};

async function getUsers() {
  const params = {
    TableName: process.env.USERS_TABLE
  };
  
  const result = await dynamodb.scan(params).promise();
  
  return {
    statusCode: 200,
    body: JSON.stringify(result.Items)
  };
}

async function getUser(userId) {
  const params = {
    TableName: process.env.USERS_TABLE,
    Key: { id: userId }
  };
  
  const result = await dynamodb.get(params).promise();
  
  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'User not found' })
    };
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify(result.Item)
  };
}
```

### API Gateway
```yaml
Resources:
  ApiGatewayRestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: user-api
      Description: API for user management

  UsersResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ParentId: !GetAtt ApiGatewayRestApi.RootResourceId
      PathPart: users

  UserResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ParentId: !Ref UsersResource
      PathPart: '{id}'

  GetUsersMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ResourceId: !Ref UsersResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${UserFunction.Arn}/invocations

  GetUserMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ResourceId: !Ref UserResource
      HttpMethod: GET
      AuthorizationType: NONE
      RequestParameters:
        method.request.path.id: true
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${UserFunction.Arn}/invocations

  LambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref UserFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*/*
```

## Infrastructure as Code

### AWS CloudFormation
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Web application infrastructure'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c55b159cbfafe1f0
    us-west-2:
      AMI: ami-0b5eea76982371e26

Resources:
  WebAppInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: !FindInMap [RegionMap, !Ref "AWS::Region", AMI]
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-web-app
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Hello from ${Environment}</h1>" > /var/www/html/index.html

  WebAppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable HTTP access
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0

Outputs:
  InstanceId:
    Description: Instance ID
    Value: !Ref WebAppInstance
    Export:
      Name: !Sub ${AWS::StackName}-InstanceId

  PublicIP:
    Description: Public IP address
    Value: !GetAtt WebAppInstance.PublicIp
```

### AWS CDK (Cloud Development Kit)
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class WebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'WebAppVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      natGateways: 2
    });

    // RDS Database
    const database = new rds.DatabaseInstance(this, 'WebAppDB', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.SMALL),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'WebAppCluster', {
      vpc
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'WebAppTask', {
      memoryLimitMiB: 512,
      cpu: 256
    });

    const container = taskDefinition.addContainer('web-app', {
      image: ecs.ContainerImage.fromAsset('./app'),
      environment: {
        DATABASE_HOST: database.instanceEndpoint.hostname,
        DATABASE_NAME: database.instanceEndpoint.socketAddress
      }
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP
    });

    // Service
    const service = new ecs.FargateService(this, 'WebAppService', {
      cluster,
      taskDefinition,
      desiredCount: 2
    });

    // Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'WebAppLB', {
      vpc,
      internetFacing: true
    });

    const listener = loadBalancer.addListener('WebAppListener', {
      port: 80,
      open: true
    });

    listener.addTargets('WebAppTarget', {
      port: 80,
      targets: [service]
    });
  }
}
```

## Common Interview Questions

### Q: What is the difference between EC2 and Lambda?
A: 
**EC2:**
- Virtual servers with full control
- Pay for running time (hourly)
- Custom OS and runtime
- Suitable for long-running applications

**Lambda:**
- Serverless functions
- Pay for execution time (millisecond)
- Managed runtime
- Suitable for event-driven workloads

### Q: Explain S3 storage classes
A: S3 storage classes:
- **Standard**: Frequent access, high durability
- **Intelligent-Tiering**: Automatic tiering based on access
- **Infrequent Access**: Less frequent access, lower cost
- **Glacier**: Long-term archival, very low cost
- **Deep Archive**: Rarely accessed, lowest cost

### Q: What is VPC and why is it important?
A: VPC (Virtual Private Cloud):
- **Isolated network**: Private section of AWS cloud
- **Network control**: IP ranges, subnets, route tables
- **Security**: Network ACLs, security groups
- **Hybrid connectivity**: VPN, Direct Connect

### Q: How does AWS handle high availability?
A: High availability strategies:
- **Multi-AZ**: Multiple availability zones
- **Auto Scaling**: Automatic scaling based on demand
- **Load Balancing**: Distribute traffic across instances
- **Route 53**: DNS failover and health checks
- **Cross-region replication**: Disaster recovery

### Q: What is the difference between IAM roles and users?
A: 
**IAM Users:**
- Long-term credentials
- For people or applications
- Access keys and passwords
- Need rotation policies

**IAM Roles:**
- Temporary credentials
- For AWS services or federated users
- Automatically rotated
- No credential management

## Best Practices

### Security
```yaml
# Enable encryption everywhere
Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      StorageEncrypted: true
      KmsKeyId: !Ref DatabaseKMSKey
```

### Cost Optimization
```yaml
# Use spot instances for cost savings
Resources:
  ComputeEnvironment:
    Type: AWS::Batch::ComputeEnvironment
    Properties:
      ComputeResources:
        Type: MANAGED
        BidPercentage: 70
        SpotIamFleetRole: !Ref SpotFleetRole
        InstanceTypes: [optimal]
        MinvCpus: 0
        DesiredvCpus: 0
        MaxvCpus: 256
```

### Monitoring and Logging
```javascript
// CloudWatch metrics
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

async function publishCustomMetric(metricName, value, unit = 'Count') {
  const params = {
    Namespace: 'CustomMetrics',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
        Dimensions: [
          {
            Name: 'Environment',
            Value: process.env.ENVIRONMENT
          }
        ]
      }
    ]
  };
  
  return cloudwatch.putMetricData(params).promise();
}
```

## Advanced Topics

### Event-Driven Architecture
```javascript
// SNS + SQS + Lambda pattern
const AWS = require('aws-sdk');

// SNS Publisher
async function publishEvent(topicArn, event) {
  const sns = new AWS.SNS();
  
  const params = {
    TopicArn: topicArn,
    Message: JSON.stringify(event),
    MessageAttributes: {
      'event-type': {
        DataType: 'String',
        StringValue: event.type
      }
    }
  };
  
  return sns.publish(params).promise();
}

// SQS Consumer (Lambda handler)
exports.handler = async (event) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    
    switch (message.type) {
      case 'user.created':
        await handleUserCreated(message.data);
        break;
      case 'order.placed':
        await handleOrderPlaced(message.data);
        break;
    }
  }
};
```

### Infrastructure Patterns
```yaml
# Blue-Green Deployment
Resources:
  BlueTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: blue-target-group
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC

  GreenTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: green-target-group
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC

  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref LoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref BlueTargetGroup
```
