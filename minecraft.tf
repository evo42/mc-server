module "mc-ilias" {
  source       = "./modules/minecraft-server"
  server_name  = "mc-ilias"
  motd         = "mc-ilias Server"
  data_path    = "${path.cwd}/mc-ilias/data"
  datapacks_path = "${path.cwd}/mc-ilias/datapacks"
}

module "mc-niilo" {
  source       = "./modules/minecraft-server"
  server_name  = "mc-niilo"
  motd         = "mc-niilo Server"
  data_path    = "${path.cwd}/mc-niilo/data"
  datapacks_path = "${path.cwd}/mc-niilo/datapacks"
}

module "mc-bgstpoelten" {
  source       = "./modules/minecraft-server"
  server_name  = "mc-bgstpoelten"
  motd         = "mc-bgstpoelten Server"
  data_path    = "${path.cwd}/bgstpoelten-mc-landing/data"
  datapacks_path = "${path.cwd}/bgstpoelten-mc-landing/datapacks"
}

module "mc-htlstp" {
  source       = "./modules/minecraft-server"
  server_name  = "mc-htlstp"
  motd         = "mc-htlstp Server"
  data_path    = "${path.cwd}/htlstp-mc-landing/data"
  datapacks_path = "${path.cwd}/htlstp-mc-landing/datapacks"
}

module "mc-borgstpoelten" {
  source       = "./modules/minecraft-server"
  server_name  = "mc-borgstpoelten"
  motd         = "mc-borgstpoelten Server"
  data_path    = "${path.cwd}/borgstpoelten-mc-landing/data"
  datapacks_path = "${path.cwd}/borgstpoelten-mc-landing/datapacks"
}

module "mc-hakstpoelten" {
  source       = "./modules/minecraft-server"
  server_name  = "mc-hakstpoelten"
  motd         = "mc-hakstpoelten Server"
  data_path    = "${path.cwd}/hakstpoelten-mc-landing/data"
  datapacks_path = "${path.cwd}/hakstpoelten-mc-landing/datapacks"
}

module "mc-basop-bafep-stp" {
  source       = "./modules/minecraft-server"
  server_name  = "mc-basop-bafep-stp"
  motd         = "mc-basop-bafep-stp Server"
  data_path    = "${path.cwd}/basop-bafep-stp-mc-landing/data"
  datapacks_path = "${path.cwd}/basop-bafep-stp-mc-landing/datapacks"
}

module "mc-play" {
  source       = "./modules/minecraft-server"
  server_name  = "mc-play"
  motd         = "mc-play Server"
  data_path    = "${path.cwd}/play-mc-landing/data"
  datapacks_path = "${path.cwd}/play-mc-landing/datapacks"
}
