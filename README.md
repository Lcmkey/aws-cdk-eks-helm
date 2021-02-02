# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

# Deploying Helm charts using AWS-CDK

In this blog, we will be looking at deploying an application on Kubernetes using infrastructure as code. Describing your infrastructure as code is a good way to build and maintain that infrastructure consistently and securely. There are numerous frameworks available to do this for cloud infrastructure. Some are for multi-cloud usages, like Terraform, others are vendor-specific like CloudFormation (AWS) or ARM (Azure).

For this demo, we will be looking at setting up WordPress on Kubernetes in AWS. Let’s break this down into what we are going to build/deploy:

1. AWS infrastructure

   1. VPC
   2. Public subnet
   3. Internet gateway
   4. Security groups
   5. EKS on EC2

2. Containerized WordPress

In this particular case, it is required to use EKS on EC2. Currently, CloudFormation and CDK don’t support provisioning EFS on Fargate.

## **Helm**

In order to deploy the WordPress container, we will be using a Helm chart. For those not familiar with Helm, I’ll provide a quick rundown. Helm is a tool that is used to manage Kubernetes applications. You can compare it to YUM, the package manager for RedHat. A Helm chart can be used to deploy anything from a very simple one pod application to something very complex consisting out of multiple server applications and databases. There are a lot of Helm charts made publically available for OpenSource projects. For this demo, we will make use of a WordPress chart provided by Bitnami.

## **AWS Cloud Development Kit**

As mentioned before the infrastructure will be coded. As it is on AWS, CloudFormation would make the most sense. However, AWS provides us with another great tool, namely the AWS Cloud Development Kit (CDK). CDK is a programmatic framework that ultimately produces CloudFormation for you and deploys it using stacks. CDK provides basic building blocks that provide you with all the resources required to get things done, and this drastically reduces the number of lines needed to code compared to pure CloudFormation.

## **Warning**

One last thing, the code in this blog is not in any form or shape intended for production environments. To keep the example code clean and easy to follow, aspects like security, availability and maintainability have not been taken into consideration.

## **Check current running service**

The output provides the command to update the kubectl config. After running it, request the services to get the hostname attached to your installation. Copy the URL mentioned in the External-IP and paste it into your browser to see the end result of your deployment.

```bash
$ kubectl get -n wordpress svc
NAME                TYPE           CLUSTER-IP      EXTERNAL-IP                                                               PORT(S)                      AGE
wp-demo-mariadb     ClusterIP      172.20.17.116                                                                       3306/TCP                     21h
wp-demo-wordpress   LoadBalancer   172.20.63.71    a119f20f6ceba4e6797e97fb119ab98f-1923973079.eu-west-1.elb.amazonaws.com   80:31320/TCP,443:31989/TCP   21h
```

## **Finally**

There you have it. A WordPress blog deployed using CDK and Helm. All the code is available from this git repo. There will be a second part to this series, where instead of using the default ingress controller, the AWS ALB Ingress Controller and External DNS will be used.

**TIP**

Whilst developing it’s generally a good idea to first deploy the EKS cluster, once that’s done deploy your charts. The EKS cluster can take a long time to deploy and an equally long time to destroy. If you deploy EKS and your chart in a single run and your chart fails, it will roll back the entire run. You’ll end up wasting a lot of time waiting for your cluster to be destroyed and rebuilt in your next attempt. If you deploy your cluster successfully and in a subsequent deployment your chart fails, only your chart rolls back, and your cluster is kept.

**TIP**

By default, the chart also creates a database pod. When you uninstall the chart, the PVC that comes with the database pod does not get destroyed. Any subsequent deployments of the chart fail because it can’t complete the new claim. You have to delete the PVC by hand.

**TIP**

There is one more oddity with this setup. When you destroy the entire stack, more often than not deletion of all resources fails. This is because the elastic IP associated with the load balancer does not get removed properly. If you find yourself in this situation, manually destroy the elastic IP, and you can finish deleting the entire stack.

<!-- Reference -->

[deploying helm charts using aws-cdk]: https://www.fourco.nl/blogs/deploying-helm-charts-using-aws-cdk/
[ aws-load-balancer-controller]: https://github.com/kubernetes-sigs/aws-load-balancer-controller
