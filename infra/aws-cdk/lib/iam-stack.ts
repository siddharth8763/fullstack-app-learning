import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface IamStackProps extends cdk.StackProps {
  // No additional props needed
}

export class IamStack extends cdk.Stack {
  public readonly executionRole: iam.IRole;
  public readonly taskRole: iam.IRole;

  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id, props);

    // ECS Task Execution Role - allows ECS to pull images and write logs
    this.executionRole = new iam.Role(this, 'EcsExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'ECS task execution role for Full Stack Platform',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // ECS Task Role - allows containers to access AWS services
    this.taskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'ECS task role for Full Stack Platform services',
    });

    // Policy for accessing secrets (database credentials)
    const secretsAccessPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
      ],
      resources: [
        // This will be updated when we know the secret ARN
        'arn:aws:secretsmanager:*:*:secret:fullstack-platform-db-credentials-*',
      ],
    });

    // Policy for CloudWatch Logs
    const cloudWatchLogsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['arn:aws:logs:*:*:*'],
    });

    // Policy for ECS service discovery (if needed)
    const serviceDiscoveryPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'servicediscovery:DiscoverInstances',
        'servicediscovery:GetInstance',
      ],
      resources: ['arn:aws:servicediscovery:*:*:service/*'],
    });

    // Policy for SSM Parameter Store (for configuration)
    const ssmPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
      ],
      resources: ['arn:aws:ssm:*:*:parameter/fullstack-platform/*'],
    });

    // Add policies to task role
    this.taskRole.addToPolicy(secretsAccessPolicy);
    this.taskRole.addToPolicy(cloudWatchLogsPolicy);
    this.taskRole.addToPolicy(serviceDiscoveryPolicy);
    this.taskRole.addToPolicy(ssmPolicy);

    // Outputs
    new cdk.CfnOutput(this, 'EcsExecutionRoleArn', {
      value: this.executionRole.roleArn,
      description: 'ECS Execution Role ARN',
    });

    new cdk.CfnOutput(this, 'EcsTaskRoleArn', {
      value: this.taskRole.roleArn,
      description: 'ECS Task Role ARN',
    });
  }
}
