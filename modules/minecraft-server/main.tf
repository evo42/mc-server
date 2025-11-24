resource "docker_image" "minecraft_server" {
  name         = var.server_name
  build {
    context    = "../../minecraft-base"
    dockerfile = "Dockerfile.consolidated"
  }
}

resource "docker_container" "minecraft_server" {
  name  = var.server_name
  image = docker_image.minecraft_server.latest
  volumes {
    host_path      = var.data_path
    container_path = "/data"
  }
  volumes {
    host_path      = var.datapacks_path
    container_path = "/data/datapacks"
  }
  environment = {
    EULA                        = var.mc_eula
    VERSION                     = var.mc_version
    MEMORY                      = var.mc_memory
    MAX_MEMORY                  = var.mc_max_memory
    TYPE                        = "PAPER"
    ONLINE_MODE                 = var.mc_online_mode
    ENABLE_PROXY_CONNECTIONS    = true
    MOTD                        = var.motd
    SERVER_DIR                  = "/data"
  }
  networks_advanced {
    name = var.network_name
  }
}
