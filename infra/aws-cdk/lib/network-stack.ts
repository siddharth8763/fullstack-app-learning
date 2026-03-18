import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface NetworkStackProps extends cdk.StackProps {
  // No additional props needed
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly backendSecurityGroup: ec2.ISecurityGroup;
  public readonly databaseSecurityGroup: ec2.ISecurityGroup;
  public readonly albSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'ApplicationVpc', {
      vpcName: 'fullstack-platform-vpc',
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      natGateways: 2,
      
      // Subnet configuration
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Security Groups
    this.backendSecurityGroup = new ec2.SecurityGroup(this, 'BackendSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for backend services',
      allowAllOutbound: true,
    });

    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // Security Group Rules
    
    // Allow HTTP from ALB to backend services
    this.backendSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000), // API Gateway
      'Allow HTTP from ALB to API Gateway'
    );

    this.backendSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3001), // Auth Service
      'Allow HTTP from ALB to Auth Service'
    );

    this.backendSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3002), // User Service
      'Allow HTTP from ALB to User Service'
    );

    // Allow MySQL from backend services to database
    this.databaseSecurityGroup.addIngressRule(
      this.backendSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from backend services'
    );

    // Allow HTTP from internet to ALB
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    // Output VPC ID and subnet IDs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private subnet IDs',
    });

    new cdk.CfnOutput(this, 'DatabaseSubnetIds', {
      value: this.vpc.isolatedSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Database subnet IDs',
    });
  }
}
