# PasteVault

Self-hosted paste & file sharing. No cloud. No tracking. Just you and your server.

---

## Features

- Paste text/code with syntax highlighting
- Upload files & images with drag-and-drop
- Password-protected pastes
- Auto-expiring links (1h, 24h, 7d, 30d)
- Short shareable links (`/c/Hk3mNp`)
- Admin panel with full control
- SQLite database (zero config)
- SSL/HTTPS support
- Runs offline -- no internet required after install

---

## Quick Install (Ubuntu)

```bash
git clone https://github.com/neoauroraproject/PasteVault.git
cd PasteVault
sudo bash install.sh
```

The installer will ask:

| Prompt | Default | Description |
|--------|---------|-------------|
| Port | `3000` | Port to run on |
| Admin password | `admin` | Password for `/auth/login` |
| SSL cert path | _(empty)_ | Path to `fullchain.pem` |
| SSL key path | _(empty)_ | Path to `privkey.pem` |

After install:

```
http://your-server:3000        # Main page
http://your-server:3000/auth/login  # Admin panel
```

---

## Configuration

Config file: `/opt/pastevault/config.env`

```env
PORT=3000
ADMIN_PASSWORD=admin
SSL_CERT=/path/to/fullchain.pem
SSL_KEY=/path/to/privkey.pem
```

After editing, restart:

```bash
sudo systemctl restart pastevault
```

---

## SSL / HTTPS

**Option 1 -- Let's Encrypt (recommended):**

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

Then reinstall or edit config:

```env
SSL_CERT=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

**Option 2 -- Self-signed (for local/testing):**

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/pastevault/ssl/key.pem \
  -out /opt/pastevault/ssl/cert.pem
```

---

## Commands

```bash
sudo systemctl status pastevault     # Check status
sudo systemctl restart pastevault    # Restart
sudo systemctl stop pastevault       # Stop
sudo journalctl -u pastevault -f     # View logs
```

---

## File Structure

```
/opt/pastevault/
  config.env          # Configuration
  data/
    pastevault.db     # SQLite database
    uploads/          # Uploaded files
```

---

## Uninstall

```bash
cd /opt/pastevault
sudo bash uninstall.sh
```

---

## Admin Panel

Access at `/auth/login` with your admin password.

**Pastes tab** -- View all pastes, see passwords, copy links, delete

**Files tab** -- View all uploads, copy links, delete

**Settings tab:**
- Toggle file uploads on/off
- Set max file size (MB)
- Set allowed file formats
- Change admin password

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (standalone) |
| Database | SQLite (better-sqlite3) |
| UI | Tailwind CSS + shadcn/ui |
| Auth | HMAC-signed session tokens |
| Runtime | Node.js 20 |

---

## Requirements

- Ubuntu 20.04+
- 512MB RAM
- No internet required after install

---

<p align="center">
  Design and developed by <a href="https://t.me/hmrayserver">Hmray</a>
</p>
