resource "docker_image" "nginx" {
  name         = "nginx"
  build {
    context    = "./nginx"
    dockerfile = "Dockerfile"
  }
}

resource "docker_container" "nginx" {
  name  = "mc-nginx"
  image = docker_image.nginx.latest
  ports {
    internal = 80
    external = var.nginx_port
  }
  ports {
    internal = 443
    external = var.nginx_https_port
  }
  volumes {
    host_path      = "${path.cwd}/admin-ui-dist"
    container_path = "/usr/share/nginx/html"
  }
  volumes {
    host_path      = "${path.cwd}/nginx/conf.d"
    container_path = "/etc/nginx/conf.d"
  }
  networks_advanced {
    name = docker_network.minecraft.name
  }
}
