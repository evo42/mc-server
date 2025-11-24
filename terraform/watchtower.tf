resource "docker_image" "watchtower" {
  name = "containrrr/watchtower"
}

resource "docker_container" "watchtower" {
  name  = "mc-watchtower"
  image = docker_image.watchtower.latest
  volumes {
    host_path      = "/var/run/docker.sock"
    container_path = "/var/run/docker.sock"
  }
  command = ["--interval", "30", "--cleanup"]
  environment = {
    DOCKER_API_VERSION = "1.44"
  }
}
