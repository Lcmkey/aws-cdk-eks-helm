import { Construct, Stack, StackProps } from "@aws-cdk/core";
import {
  Vpc,
  InstanceType,
  InstanceClass,
  InstanceSize,
  NatProvider,
  SubnetType,
} from "@aws-cdk/aws-ec2";
import {
  Role,
  AccountRootPrincipal,
  ServicePrincipal,
  ManagedPolicy,
} from "@aws-cdk/aws-iam";
import { Cluster, KubernetesVersion } from "@aws-cdk/aws-eks";

export interface AwsCdkHlemStackProps extends StackProps {
  readonly prefix: string;
  readonly stage: string;
}

export class AwsCdkHlemStack extends Stack {
  constructor(scope: Construct, id: string, props: AwsCdkHlemStackProps) {
    super(scope, id, props);

    /**
     * Get var from props
     */
    const { prefix, stage } = props;

    /**
     * Create Ec2 Nat Instance
     */
    const natInstance = NatProvider.instance({
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
    });

    /**
     * The code that defines your stack goes here
     */
    const vpc = new Vpc(this, `${prefix}-${stage}-Vpc`, {
      cidr: "10.1.0.0/16",
      maxAzs: 3,
      natGateways: 2,
      natGatewayProvider: natInstance,
      natGatewaySubnets: {
        subnetGroupName: "Public EKS",
      },
      subnetConfiguration: [
        {
          name: "Public EKS",
          cidrMask: 24,
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: "Private EKS",
          cidrMask: 24,
          subnetType: SubnetType.PRIVATE,
        },
      ],
    });

    /**
     * Role Definitions
     */
    const adminRole = new Role(this, `${prefix}-${stage}-Admin-Role`, {
      assumedBy: new AccountRootPrincipal(),
    });

    const eksRole = new Role(this, `${prefix}-${stage}-Eks-Role`, {
      roleName: `${prefix}-${stage}-Eks-Role`,
      assumedBy: new ServicePrincipal("eks.amazonaws.com"),
    });

    /**
     * Assign Policy to role
     */
    eksRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSServicePolicy"),
    );

    eksRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSClusterPolicy"),
    );

    /**
     * Cluster Definition
     */
    const cluster = new Cluster(this, `${prefix}-${stage}-Cluster`, {
      clusterName: `${prefix}-${stage}-Cluster`,
      version: KubernetesVersion.V1_18,
      vpc: vpc,
      mastersRole: adminRole,
      role: eksRole,
    });

    cluster.addHelmChart("wordpress", {
      repository: "https://charts.bitnami.com/bitnami",
      chart: "wordpress",
      release: "wp-demo",
      namespace: "wordpress",
      values: {
        wordpressBlogName: "My demo blog.",
        wordpressFirstName: "Emiel",
        wordpressLastName: "Kremers",
        wordpressUsername: "demo",
        wordpressPassword: "Welc0me",
      },
    });
  }
}
