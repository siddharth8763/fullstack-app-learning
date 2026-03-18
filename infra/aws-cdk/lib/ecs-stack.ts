import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface EcsStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  database: rds.IDatabaseInstance;
  executionRole: iam.IRole;
  taskRole: iam.IRole;
}

export class EcsStack extends cdk.Stack {
  public readonly cluster: ecs.ICluster;
  public readonly loadBalancer: elbv2.IApplicationLoadBalancer;
  public readonly apiGatewayService: ecs.IService;
  public readonly authService: ecs.IService;
  public readonly userService: ecs.IService;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    // Create ECS Cluster
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: 'fullstack-platform-cluster',
      containerInsights: true,
    });

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc: props.vpc,
      internetFacing: true,
      loadBalancerType: elbv2.LoadBalancerType.APPLICATION,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Create Log Groups for each service
    const apiGatewayLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: '/ecs/fullstack-platform/api-gateway',
      retention: logs.RetentionDays.ONE_WEEK,
    });

    const authServiceLogGroup = new logs.LogGroup(this, 'AuthServiceLogGroup', {
      logGroupName: '/ecs/fullstack-platform/auth-service',
      retention: logs.RetentionDays.ONE_WEEK,
    });

    const userServiceLogGroup = new logs.LogGroup(this, 'UserServiceLogGroup', {
      logGroupName: '/ecs/fullstack-platform/user-service',
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Task Definitions
    const apiGatewayTaskDefinition = new ecs.FargateTaskDefinition(this, 'ApiGatewayTaskDefinition', {
      executionRole: props.executionRole,
      taskRole: props.taskRole,
      cpu: 256,
      memoryLimitMiB: 512,
    });

    const authTaskDefinition = new ecs.FargateTaskDefinition(this, 'AuthTaskDefinition', {
      executionRole: props.executionRole,
      taskRole: props.taskRole,
      cpu: 256,
      memoryLimitMiB: 512,
    });

    const userTaskDefinition = new ecs.FargateTaskDefinition(this, 'UserTaskDefinition', {
      executionRole: props.executionRole,
      taskRole: props.taskRole,
      cpu: 256,
      memoryLimitMiB: 512,
    });

    // Container Definitions
    // API Gateway Container
    const apiGatewayContainer = apiGatewayTaskDefinition.addContainer('ApiGatewayContainer', {
      image: ecs.ContainerImage.fromAsset('../../services/api-gateway'),
      portMappings: [{ containerPort: 3000, protocol: ecs.Protocol.TCP }],
      environment: {
        NODE_ENV: 'production',
        AUTH_SERVICE_URL: 'http://auth-service:3001',
        USER_SERVICE_URL: 'http://user-service:3002',
      },
      logging: ecs.LogDrivers.awsLogs({
        logGroup: apiGatewayLogGroup,
        streamPrefix: 'api-gateway',
      }),
    });

    // Auth Service Container
    const authContainer = authTaskDefinition.addContainer('AuthContainer', {
      image: ecs.ContainerImage.fromAsset('../../services/auth-service'),
      portMappings: [{ containerPort: 3001, protocol: ecs.Protocol.TCP }],
      environment: {
        NODE_ENV: 'production',
        DATABASE_URL: `mysql://${props.database.instanceEndpoint.hostname}:3306/fullstack_platform`,
        JWT_SECRET: 'your-production-jwt-secret',
        JWT_REFRESH_SECRET: 'your-production-refresh-secret',
      },
      secrets: {
        DATABASE_CREDENTIALS: ecs.Secret.fromSecretsManager(
          ecs.Secret.fromSecretsManagerName('fullstack-platform-db-credentials')
        ),
      },
      logging: ecs.LogDrivers.awsLogs({
        logGroup: authServiceLogGroup,
        streamPrefix: 'auth-service',
      }),
    });

    // User Service Container
    const userContainer = userTaskDefinition.addContainer('UserContainer', {
      image: ecs.ContainerImage.fromAsset('../../services/user-service'),
      portMappings: [{ containerPort: 3002, protocol: ecs.Protocol.TCP }],
      environment: {
        NODE_ENV: 'production',
        DATABASE_URL: `mysql://${props.database.instanceEndpoint.hostname}:3306/fullstack_platform`,
      },
      secrets: {
        DATABASE_CREDENTIALS: ecs.Secret.fromSecretsManager(
          ecs.Secret.fromSecretsManagerName('fullstack-platform-db-credentials')
        ),
      },
      logging: ecs.LogDrivers.awsLogs({
        logGroup: userServiceLogGroup,
        streamPrefix: 'user-service',
      }),
    });

    // Target Groups
    const apiGatewayTargetGroup = new elbv2.ApplicationTargetGroup(this, 'ApiGatewayTargetGroup', {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    const authTargetGroup = new elbv2.ApplicationTargetGroup(this, 'AuthTargetGroup', {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    const userTargetGroup = new elbv2.ApplicationTargetGroup(this, 'UserTargetGroup', {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // Load Balancer Listener
    const listener = this.loadBalancer.addListener('Listener', {
      port: 80,
      open: true,
    });

    // Listener Rules
    listener.addTargetGroups('ApiGatewayRule', {
      priority: 1,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*'])],
      targetGroups: [apiGatewayTargetGroup],
    });

    listener.addTargetGroups('DefaultRule', {
      priority: 100,
      targetGroups: [apiGatewayTargetGroup],
    });

    // ECS Services
    this.apiGatewayService = new ecs.FargateService(this, 'ApiGatewayService', {
      cluster: this.cluster,
      taskDefinition: apiGatewayTaskDefinition,
      desiredCount: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
    });

    this.authService = new ecs.FargateService(this, 'AuthService', {
      cluster: this.cluster,
      taskDefinition: authTaskDefinition,
      desiredCount: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
    });

    this.userService = new ecs.FargateService(this, 'UserService', {
      cluster: this.cluster,
      taskDefinition: userTaskDefinition,
      desiredCount: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
    });

    // Connect services to target groups
    apiGatewayTargetGroup.addTarget(this.apiGatewayService);
    authTargetGroup.addTarget(this.authService);
    userTargetGroup.addTarget(this.userService);

    // Service Discovery (optional - for internal communication)
    const cloudMapNamespace = new ecs.CloudMapNamespace(this, 'CloudMapNamespace', {
      name: 'fullstack-platform.local',
      vpc: props.vpc,
    });

    // Create service registry entries
    new ecs.CloudMapService(this, 'ApiGatewayServiceDiscovery', {
      cloudMapNamespace,
      name: 'api-gateway',
      dnsRecordType: ecs.DnsRecordType.A,
      dnsTtl: cdk.Duration.seconds(60),
    });

    new ecs.CloudMapService(this, 'AuthServiceDiscovery', {
      cloudMapNamespace,
      name: 'auth-service',
      dnsRecordType: ecs.DnsRecordType.A,
      dnsTtl: cdk.Duration.seconds(60),
    });

    new ecs.CloudMapService(this, 'UserServiceDiscovery', {
      cloudMapNamespace,
      name: 'user-service',
      dnsRecordType: ecs.DnsRecordType.A,
      dnsTtl: cdk.Duration.seconds(60),
    });

    // Auto Scaling
    const apiGatewayScaling = this.apiGatewayService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    apiGatewayScaling.scaleOnCpuUtilization('ApiGatewayCpuScaling', {
      targetUtilizationPercent: 70,
    });

    const authScaling = this.authService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    authScaling.scaleOnCpuUtilization('AuthCpuScaling', {
      targetUtilizationPercent: 70,
    });

    const userScaling = this.userService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    userScaling.scaleOnCpuUtilization('UserCpuScaling', {
      targetUtilizationPercent: 70,
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster Name',
    });

    new cdk.CfnOutput(this, 'ApiGatewayServiceArn', {
      value: this.apiGatewayService.serviceArn,
      description: 'API Gateway Service ARN',
    });

    new cdk.CfnOutput(this, 'AuthServiceArn', {
      value: this.authService.serviceArn,
      description: 'Auth Service ARN',
    });

    new cdk.CfnOutput(this, 'UserServiceArn', {
      value: this.userService.serviceArn,
      description: 'User Service ARN',
    });
  }
}
