import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.IDatabaseInstance;
  public readonly databaseSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create database credentials secret
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: 'fullstack-platform-db-credentials',
      description: 'Database credentials for Full Stack Platform',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'admin',
        }),
        generateStringKey: 'password',
        passwordLength: 32,
        excludePunctuation: true,
      },
    });

    // Create RDS MySQL instance
    this.database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: 'fullstack-platform-db',
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [
        // This will be set by the network stack
      ],
      databaseName: 'fullstack_platform',
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      
      // Multi-AZ for high availability
      multiAz: true,
      
      // Storage configuration
      allocatedStorage: 100,
      maxAllocatedStorage: 1000,
      storageType: rds.StorageType.GP2,
      
      // Backup and maintenance
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      
      // Deletion policy
      deletionProtection: false,
      
      // Monitoring
      monitoringInterval: cdk.Duration.minutes(60),
      enablePerformanceInsights: true,
      
      // Remove public accessibility
      publiclyAccessible: false,
    });

    // Allow connections from backend security group
    const backendSecurityGroup = ec2.SecurityGroup.fromLookup(
      this,
      'BackendSecurityGroup',
      {
        vpc: props.vpc,
        securityGroupName: 'BackendSecurityGroup',
      }
    );

    this.database.connections.allowFrom(backendSecurityGroup, ec2.Port.tcp(3306));

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseInstanceArn', {
      value: this.database.instanceArn,
      description: 'RDS Database Instance ARN',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecret.secretArn,
      description: 'Database Secret ARN',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'Database Endpoint',
    });
  }
}
