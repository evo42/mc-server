variable "mc_version" {
  description = "The version of Minecraft to use."
  type        = string
  default     = "1.21.1"
}

variable "mc_eula" {
  description = "Whether to accept the Minecraft EULA."
  type        = bool
  default     = true
}

variable "mc_memory" {
  description = "The amount of memory to allocate to the Minecraft server."
  type        = string
  default     = "4G"
}

variable "mc_max_memory" {
  description = "The maximum amount of memory to allocate to the Minecraft server."
  type        = string
  default     = "8G"
}

variable "mc_online_mode" {
  description = "Whether to enable online mode."
  type        = bool
  default     = false
}

variable "proxy_port" {
  description = "The port to expose for the BungeeCord proxy."
  type        = number
  default     = 25565
}

variable "admin_api_port" {
  description = "The port to expose for the admin API."
  type        = number
  default     = 3000
}

variable "nginx_port" {
  description = "The port to expose for the Nginx reverse proxy."
  type        = number
  default     = 80
}

variable "nginx_https_port" {
  description = "The port to expose for the Nginx reverse proxy (HTTPS)."
  type        = number
  default     = 443
}

variable "admin_user" {
  description = "The username for the admin API."
  type        = string
}

variable "admin_pass" {
  description = "The password for the admin API."
  type        = string
}
