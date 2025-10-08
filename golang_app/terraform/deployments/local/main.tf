terraform {
  required_version = "~> 1.13"

  backend "local" {}
  # backend "s3" {
  #   bucket                      = "terraform-state-bucket"
  #   key                         = "payment-options/terraform.tfstate"
  #   region                      = "eu-west-1"
  #   endpoint                    = "http://localhost:4566"
  #   force_path_style            = true
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  #   skip_region_validation      = true
  # }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6"
    }
  }
}
