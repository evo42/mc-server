  cloud {
    organization = "YOUR_ORG_NAME" # Replace with your Terraform Cloud organization name

    workspaces {
      name = "mc-server-prod"
    }
  }

terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 2.15.0"
    }
  }
}

provider "docker" {}

resource "docker_network" "minecraft" {
  name = "minecraft-net"
}
