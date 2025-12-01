import http.server
import socketserver
import json
import os
import datetime
from urllib.parse import urlparse, parse_qs


MC_SERVERS = {
    "mc-ilias",
    "mc-niilo",
    "mc-bgstpoelten",
    "mc-htlstp",
    "mc-borgstpoelten",
    "mc-hakstpoelten",
    "mc-basop-bafep-stp",
    "mc-play",
}

MINECRAFT_DATA_ROOT = "/minecraft-data"
BACKUP_ROOT = "/data/backups"


class Handler(http.server.SimpleHTTPRequestHandler):
    def _send_json(self, status_code, payload):
        self.send_response(status_code)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def _normalize_path(self, root, rel_path):
        rel_path = rel_path.lstrip("/")
        target = os.path.normpath(os.path.join(root, rel_path))
        if not target.startswith(root):
            raise ValueError("Path traversal detected")
        return target

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/api/health":
            return self._send_json(200, {"status": "ok", "version": "demo-mcdash"})

        if path.startswith("/api/files/"):
            return self.handle_files(path, query)

        if path.startswith("/api/console/"):
            return self.handle_console(path, query)

        if path.startswith("/api/backups/"):
            return self.handle_backups(path)

        # Fallback HTML landing page
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(b"<html><body><h1>MCDash</h1><p>Welcome to MCDash - Minecraft Dashboard (demo backend)</p></body></html>")

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        length = int(self.headers.get("Content-Length", 0) or 0)
        raw_body = self.rfile.read(length) if length > 0 else b"{}"
        try:
            body = json.loads(raw_body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            body = {}

        if path.startswith("/api/console/") and path.endswith("/command"):
            return self.handle_console_command(path, body)

        if path.startswith("/api/backups/") and path.endswith("/create"):
            return self.handle_backup_create(path, body)

        if path.startswith("/api/backups/") and path.endswith("/restore"):
            return self.handle_backup_restore(path, body)

        # Default echo for unknown POSTs
        return self._send_json(200, {"status": "ok", "message": "Request received"})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/backups/"):
            return self.handle_backup_delete(path)

        # Unknown DELETE endpoint
        return self._send_json(404, {"error": "Not found"})

    # --- Handlers ---
    def handle_backups(self, path):
        parts = path.rstrip("/").split("/")
        # /api/backups/<server>
        if len(parts) < 4:
            return self._send_json(400, {"error": "Missing server in path"})
        server = parts[3]
        if server not in MC_SERVERS:
            return self._send_json(400, {"error": "Unknown server", "server": server})

        backups, total_size, last_backup = self.handle_backup_list(server)
        return self._send_json(
            200,
            {
                "success": True,
                "server": server,
                "backups": backups,
                "totalSize": total_size,
                "lastBackup": last_backup,
            },
        )

    def handle_files(self, path, query):
        parts = path.rstrip("/").split("/")
        if len(parts) < 4:
            return self._send_json(400, {"error": "Missing server in path"})
        server = parts[3]
        if server not in MC_SERVERS:
            return self._send_json(400, {"error": "Unknown server", "server": server})

        root = os.path.join(MINECRAFT_DATA_ROOT, server)
        if not os.path.isdir(root):
            return self._send_json(404, {"error": "Server data not found", "server": server})

        rel_path = query.get("path", [""])[0]
        try:
            target = self._normalize_path(root, rel_path)
        except ValueError:
            return self._send_json(400, {"error": "Invalid path"})

        if not os.path.isdir(target):
            return self._send_json(404, {"error": "Directory not found", "path": rel_path})

        entries = []
        directories = []
        for name in sorted(os.listdir(target)):
            full_path = os.path.join(target, name)
            rel_child = os.path.relpath(full_path, root)
            is_dir = os.path.isdir(full_path)
            entry = {
                "name": name,
                "path": rel_child,
                "isDirectory": is_dir,
            }
            entries.append(entry)
            if is_dir:
                directories.append(entry)

        return self._send_json(
            200,
            {
                "success": True,
                "server": server,
                "path": rel_path or "/",
                "files": entries,
                "directories": directories,
            },
        )

    def handle_console(self, path, query):
        parts = path.rstrip("/").split("/")
        if len(parts) < 4:
            return self._send_json(400, {"error": "Missing server in path"})
        server = parts[3]
        if server not in MC_SERVERS:
            return self._send_json(400, {"error": "Unknown server", "server": server})

        try:
            lines_requested = int(query.get("lines", ["100"])[0])
        except ValueError:
            lines_requested = 100

        log_path = os.path.join(MINECRAFT_DATA_ROOT, server, "logs", "latest.log")
        console_lines = []

        if os.path.isfile(log_path):
            try:
                with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                    all_lines = f.readlines()
                for raw in all_lines[-lines_requested:]:
                    line = raw.rstrip("\n")
                    # Simple timestamp extraction (optional)
                    timestamp = ""
                    if line.startswith("[") and "]" in line:
                        timestamp = line.split("]", 1)[0].lstrip("[")
                    console_lines.append({"timestamp": timestamp, "message": line})
            except Exception as exc:  # noqa: BLE001
                console_lines.append({
                    "timestamp": "",
                    "message": f"Failed to read log file: {exc}",
                })
        else:
            console_lines.append({
                "timestamp": "",
                "message": "No console log available (latest.log not found)",
            })

        return self._send_json(
            200,
            {
                "success": True,
                "server": server,
                "console": console_lines,
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            },
        )

    def handle_console_command(self, path, body):
        parts = path.rstrip("/").split("/")
        # /api/console/<server>/command
        if len(parts) < 5:
            return self._send_json(400, {"error": "Missing server in path"})
        server = parts[3]
        if server not in MC_SERVERS:
            return self._send_json(400, {"error": "Unknown server", "server": server})

        command = body.get("command", "").strip()
        if not command:
            return self._send_json(400, {"error": "Missing command"})

        # Demo implementation: we do NOT execute anything, just acknowledge
        print(f"[MCDash demo] Command for {server}: {command}")

        return self._send_json(
            200,
            {
                "success": True,
                "server": server,
                "command": command,
                "result": "Command queued (demo backend - no execution)",
            },
        )

    def handle_backup_list(self, server):
        backup_dir = os.path.join(BACKUP_ROOT, server)
        backups = []
        total_size = 0
        last_ts = None

        if os.path.isdir(backup_dir):
            for name in sorted(os.listdir(backup_dir)):
                full = os.path.join(backup_dir, name)
                if not os.path.isfile(full):
                    continue
                size = os.path.getsize(full)
                mtime = os.path.getmtime(full)
                ts = datetime.datetime.utcfromtimestamp(mtime).isoformat() + "Z"
                total_size += size
                if last_ts is None or mtime > last_ts[0]:
                    last_ts = (mtime, ts)
                backups.append(
                    {
                        "name": name,
                        "size": size,
                        "timestamp": ts,
                        "type": "full",
                    }
                )

        return backups, total_size, (last_ts[1] if last_ts else None)

    def handle_backup_create(self, path, body):
        parts = path.rstrip("/").split("/")
        # /api/backups/<server>/create
        if len(parts) < 5:
            return self._send_json(400, {"error": "Missing server in path"})
        server = parts[3]
        if server not in MC_SERVERS:
            return self._send_json(400, {"error": "Unknown server", "server": server})

        name = (body.get("name") or "").strip()
        backup_type = body.get("type") or "full"
        timestamp = body.get("timestamp") or datetime.datetime.utcnow().isoformat() + "Z"

        os.makedirs(os.path.join(BACKUP_ROOT, server), exist_ok=True)
        safe_name = name.replace("/", "_") or "backup"
        filename = f"{timestamp.replace(':', '-')}_{backup_type}_{safe_name}.bak"
        full_path = os.path.join(BACKUP_ROOT, server, filename)

        # Create an empty marker file to represent the backup
        try:
            with open(full_path, "w", encoding="utf-8") as f:
                f.write("MCDash demo backup marker\n")
        except Exception as exc:  # noqa: BLE001
            return self._send_json(500, {"error": f"Failed to create backup: {exc}"})

        backup_obj = {
            "name": filename,
            "type": backup_type,
            "timestamp": timestamp,
            "status": "created",
        }

        return self._send_json(
            200,
            {
                "success": True,
                "server": server,
                "backup": backup_obj,
            },
        )

    def handle_backup_restore(self, path, body):
        parts = path.rstrip("/").split("/")
        # /api/backups/<server>/restore
        if len(parts) < 5:
            return self._send_json(400, {"error": "Missing server in path"})
        server = parts[3]
        if server not in MC_SERVERS:
            return self._send_json(400, {"error": "Unknown server", "server": server})

        backup_name = (body.get("backupName") or "").strip()
        if not backup_name:
            return self._send_json(400, {"error": "Missing backupName"})

        root = os.path.join(BACKUP_ROOT, server)
        try:
            full_path = self._normalize_path(root, backup_name)
        except ValueError:
            return self._send_json(400, {"error": "Invalid backup name"})

        if not os.path.isfile(full_path):
            return self._send_json(404, {"error": "Backup not found", "backupName": backup_name})

        # Demo implementation: no actual world restore, just report success
        mtime = os.path.getmtime(full_path)
        ts = datetime.datetime.utcfromtimestamp(mtime).isoformat() + "Z"
        backup_obj = {
            "name": backup_name,
            "type": "full",
            "timestamp": ts,
            "status": "restored",
        }

        return self._send_json(
            200,
            {
                "success": True,
                "server": server,
                "backup": backup_obj,
            },
        )

    def handle_backup_delete(self, path):
        parts = path.rstrip("/").split("/")
        # /api/backups/<server>/<backupName>
        if len(parts) < 5:
            return self._send_json(400, {"error": "Missing server or backup name in path"})
        server = parts[3]
        if server not in MC_SERVERS:
            return self._send_json(400, {"error": "Unknown server", "server": server})

        backup_name = parts[4]
        root = os.path.join(BACKUP_ROOT, server)
        try:
            full_path = self._normalize_path(root, backup_name)
        except ValueError:
            return self._send_json(400, {"error": "Invalid backup name"})

        if not os.path.exists(full_path):
            return self._send_json(404, {"error": "Backup not found", "backupName": backup_name})

        try:
            os.remove(full_path)
        except Exception as exc:  # noqa: BLE001
            return self._send_json(500, {"error": f"Failed to delete backup: {exc}"})

        return self._send_json(
            200,
            {
                "success": True,
                "server": server,
                "backupName": backup_name,
                "result": "Backup deleted",
            },
        )


PORT = 8080
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()
