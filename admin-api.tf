resource "docker_image" "admin-api" {
  name         = "admin-api"
  build {
    context    = "./admin-api"
    dockerfile = "Dockerfile"
  }
}

resource "docker_container" "admin-api" {
  name  = "mc-admin-api"
  image = docker_image.admin-api.latest
  ports {
    internal = 3000
    external = var.admin_api_port
  }
  volumes {
    host_path      = "/var/run/docker.sock"
    container_path = "/var/run/docker.sock"
  }
  volumes {
    host_path      = module.mc-ilias.datapacks_path
    container_path = "/app/mc-ilias/datapacks"
  }
  volumes {
    host_path      = module.mc-niilo.datapacks_path
    container_path = "/app/mc-niilo/datapacks"
  }
  volumes {
    host_path      = module.mc-bgstpoelten.datapacks_path
    container_path = "/app/bgstpoelten/datapacks"
  }
  volumes {
    host_path      = module.mc-htlstp.datapacks_path
    container_path = "/app/htlstp/datapacks"
  }
  volumes {
    host_path      = module.mc-borgstpoelten.datapacks_path
    container_path = "/app/borgstpoelten/datapacks"
  }
  volumes {
    host_path      = module.mc-hakstpoelten.datapacks_path
    container_path = "/app/hakstpoelten/datapacks"
  }
  volumes {
    host_path      = module.mc-basop-bafep-stp.datapacks_path
    container_path = "/app/basop-bafep-stp/datapacks"
  }
  volumes {
    host_path      = module.mc-play.datapacks_path
    container_path = "/app/play/datapacks"
  }
  environment = {
    NODE_ENV   = "production"
    ADMIN_USER = var.admin_user
    ADMIN_PASS = var.admin_pass
  }
  networks_advanced {
    name = docker_network.minecraft.name
  }
}
