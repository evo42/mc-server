variable "server_name" {
  description = "The name of the Minecraft server."
  type        = string
}

variable "motd" {
  description = "The message of the day for the Minecraft server."
  type        = string
}

variable "data_path" {
  description = "The path to the data directory for the Minecraft server."
  type        = string
}

variable "datapacks_path" {
  description = "The path to the datapacks directory for the Minecraft server."
  type        = string
}

variable "network_name" {
  description = "The name of the Docker network to connect the Minecraft server to."
  type        = string
  default     = "minecraft-net"
}
