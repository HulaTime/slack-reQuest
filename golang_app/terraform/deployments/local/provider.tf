provider "aws" {
  region = var.aws_region

  endpoints {
    s3         = var.aws_endpoint
    lambda     = var.aws_endpoint
    dynamodb   = var.aws_endpoint
    apigateway = var.aws_endpoint
  }

  skip_credentials_validation = local.use_custom_endpoint
  skip_metadata_api_check     = local.use_custom_endpoint
  skip_requesting_account_id  = local.use_custom_endpoint

  default_tags {
    tags = local.tags
  }
}

provider "datadog" {
  api_key  = "foo"
  app_key  = "bar"
  validate = "false"
}


