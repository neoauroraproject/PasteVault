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

## Install

One command:

```bash
bash <(curl -Ls https://raw.githubusercontent.com/neoauroraproject/PasteVault/main/install.sh)
```

> If the `main` branch doesn't have the installer yet, use the dev branch:
> ```bash
> bash <(curl -Ls https://raw.githubusercontent.com/neoauroraproject/PasteVault/v0/hmrayserver-6526-51e68a2f/install.sh)
> ```

The installer will ask:

| Prompt | Default | Description |
|--------|---------|-------------|
| Port | `3000` | Port to run on |
| Admin password | `admin` | Password for admin panel |
| SSL cert path | _(empty)_ | Path to `fullchain.pem` |
| SSL key path | _(empty)_ | Path to `privkey.pem` |

After install:

```
http://YOUR-IP:3000             # Main page
http://YOUR-IP:3000/auth/login  # Admin panel
```

---

## Update

Run the same command again. Your data and database are preserved:

```bash
bash <(curl -Ls https://raw.githubusercontent.com/neoauroraproject/PasteVault/main/install.sh)
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

After editing:

```bash
sudo systemctl restart pastevault
```

---

## SSL / HTTPS

**Let's Encrypt (recommended):**

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

Then edit `/opt/pastevault/config.env`:

```env
SSL_CERT=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

```bash
sudo systemctl restart pastevault
```

**Self-signed (testing only):**

```bash
mkdir -p /opt/pastevault/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/pastevault/ssl/key.pem \
  -out /opt/pastevault/ssl/cert.pem
```

---

## Commands

```bash
sudo systemctl status pastevault     # Status
sudo systemctl restart pastevault    # Restart
sudo systemctl stop pastevault       # Stop
sudo journalctl -u pastevault -f     # Logs
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
bash <(curl -Ls https://raw.githubusercontent.com/neoauroraproject/PasteVault/main/uninstall.sh)
```

---

## Admin Panel

Access at `/auth/login` with your admin password.

- **Pastes** -- View, search, copy links, delete
- **Files** -- View uploads, copy links, delete
- **Settings** -- Toggle uploads, max file size, allowed formats, change password

---

## Requirements

- Ubuntu 20.04+ (or Debian-based)
- 512MB RAM
- Root access
- No internet needed after install

---

<p align="center">
  Design and developed by <a href="https://t.me/hmrayserver">Hmray</a>
</p>
