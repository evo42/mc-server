resource "docker_image" "bungeecord" {
  name         = "bungeecord"
  build {
    context    = "./bungeecord"
    dockerfile = "Dockerfile"
  }
}

resource "docker_container" "bungeecord" {
  name  = "mc-bungeecord"
  image = docker_image.bungeecord.latest
  ports {
    internal = 25565
    external = var.proxy_port
  }
  volumes {
    host_path      = "${path.cwd}/bungeecord/config"
    container_path = "/home/bungee/server"
  }
  networks_advanced {
    name = docker_network.minecraft.name
  }
}
