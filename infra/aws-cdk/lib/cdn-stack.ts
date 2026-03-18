import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface CdnStackProps extends cdk.StackProps {
  // No additional props needed
}

export class CdnStack extends cdk.Stack {
  public readonly bucket: s3.IBucket;
  public readonly distribution: cloudfront.IDistribution;

  constructor(scope: Construct, id: string, props: CdnStackProps) {
    super(scope, id, props);

    // Create S3 bucket for frontend static assets
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: 'fullstack-platform-frontend',
      versioned: true,
      publicReadAccess: false, // Private bucket, accessed only via CloudFront
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes - use RETAIN in production
      autoDeleteObjects: true, // For demo purposes - remove in production
    });

    // Create CloudFront OAI (Origin Access Identity)
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity', {
      comment: 'OAI for Full Stack Platform frontend bucket',
    });

    // Grant CloudFront access to S3 bucket
    this.bucket.grantRead(originAccessIdentity);

    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      },
      defaultRootObject: 'index.html',
      
      // Error handling for SPA routing
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],

      // Distribution configuration
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      
      // Logging
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'CloudFrontLogsBucket', {
        bucketName: 'fullstack-platform-cloudfront-logs',
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }),
      logIncludesCookies: false,
      logFilePrefix: 'cloudfront-logs/',

      // Custom error responses for SPA
      customErrorResponses: [
        {
          errorCode: 403,
          responsePagePath: '/index.html',
          responseCode: 200,
          httpErrorCodeReturns: 403,
          ttl: cdk.Duration.seconds(0),
        },
        {
          errorCode: 404,
          responsePagePath: '/index.html',
          responseCode: 200,
          httpErrorCodeReturns: 404,
          ttl: cdk.Duration.seconds(0),
        },
      ],

      // Security headers
      geoRestriction: cloudfront.GeoRestriction.allowlist('US', 'CA', 'GB', 'DE', 'FR'),

      // WAF (optional - uncomment if you have WAF rules)
      // webAclId: 'your-waf-web-acl-id',
    });

    // Deploy frontend assets to S3
    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset('../../frontend/dist')],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      prune: true, // Remove files that are no longer in the source
      retainOnDelete: false, // For demo purposes - set to true in production
    });

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontDistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket Name for frontend assets',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'OriginAccessIdentityId', {
      value: originAccessIdentity.originAccessIdentityId,
      description: 'CloudFront Origin Access Identity ID',
    });
  }
}
