# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

# Minecraft SaaS Platform - High-Level Guide

This document provides a comprehensive overview of the Minecraft SaaS Platform, including its architecture, setup, and development processes.

## 🚀 Key Features

- **Minecraft 1.21.1 Support**: Full support for the latest Minecraft version.
- **Universal Server Image**: A single base image for all PaperMC-compatible versions.
- **Centralized Management**: Manage all services with a single `docker-compose.yml` and a Vue.js admin panel.
- **Enterprise Security**: Features like server name validation, path traversal protection, and secure container execution.

## 🏗️ Architecture Overview

The platform uses a microservices architecture with Nginx as a reverse proxy, BungeeCord for server switching, and a set of internal services including Minecraft servers, an Admin API, and Watchtower for automatic updates. The Admin API now supports in-memory statistics collection for historical performance monitoring.

## 📋 Components

- **Universal Minecraft Base Image (`minecraft-base/`)**: A secure, non-root container with a dynamic PaperMC downloader.
- **Admin API (`admin-api/`)**: A RESTful API for server management with secure Docker daemon communication. Includes a **Public API** for read-only access to status and history, and an in-memory **History Service** for performance tracking.
- **SPA Admin Panel (`admin-ui-spa/`)**: A modern Vue.js frontend for real-time monitoring and management. Features **3D performance charts** using Three.js and Chart.js.
- **Infrastructure Services**: BungeeCord, Nginx, and Watchtower.

## ⚙️ Configuration

The platform is configured using a `.env` file for essential environment variables like admin credentials, Minecraft server defaults, and network settings. Each server can be customized with its own memory allocation, game mode, and other settings.

## 🚀 Deployment

### Quick Start

1.  Install SPA frontend dependencies: `cd admin-ui-spa && npm install && npm run build && cd ..`
2.  Customize environment variables: `cp example-config/.env.example .env`
3.  Start the platform: `docker-compose up -d`

### Production Deployment

Use the provided deployment scripts (`deploy.sh`, `deploy-prod.sh`) for development and production deployments, updates, status checks, and backups.

## 📁 Project Structure

The project is organized into several directories:

-   `admin-api/`: The Node.js API service.
-   `admin-ui-spa/`: The Vue.js SPA frontend.
-   `minecraft-base/`: The universal Minecraft image.
-   `nginx/`: Web server configuration.
-   `bungeecord/`: Proxy server.
-   `example-config/`: Example configurations.
-   `docker-compose.yml`: Main orchestration file.

## 💻 Common Development Commands

### Admin API (`admin-api/`)

-   **Run the server**: `npm start`
-   **Run tests**: `npm test`

### SPA Admin Panel (`admin-ui-spa/`)

-   **Run the development server**: `npm run dev`
-   **Build for production**: `npm run build`
-   **Preview production build**: `npm run preview`
