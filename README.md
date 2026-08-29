# Beastcoin

**Beastcoin** is a super-simple crypto wallet website, inspired by Coinbase but stripped down to the essentials.

## Features

- **Puter.js authentication** — Users sign in with their Puter account (no passwords to manage yourself).
- **Admin-only coin management** — Only the admin can add or remove coins. Regular users cannot deposit or withdraw.
- **Password-protected admin** — Admin panel requires password `1324`.
- **Clean, modern UI** — Dark theme, mobile-friendly.
- **Local storage for balances** — Balances are stored in the browser (demo-friendly). For production you would replace this with a real backend.

## Admin access

Admin controls are protected by a password.

- Default password: **`1324`**
- After signing in, enter the password in the "Admin Access" box and click **Unlock Admin**.
- You can lock the panel again with the **Lock** button.

To change the password, edit this line in `app.js`:

```js
const ADMIN_PASSWORD = "1324";
```

## How it works

1. Anyone can open the site and sign in with Puter.
2. Their balance of **BEAST** coins is shown.
3. Only someone who knows the admin password can:
   - Add coins to any username
   - Remove coins from any username
   - Create new coin types (for future expansion)
4. Regular users see a read-only wallet view.

## Running locally

Just open `index.html` in a browser, or serve the folder:

```bash
npx serve .
# or
python -m http.server 3000
```

Because Puter.js uses popups for sign-in, a local server is recommended over `file://`.

## Deploy

This is a static site. You can host it on:

- GitHub Pages
- Netlify / Vercel / Cloudflare Pages
- Puter itself (`puter site deploy`)

## Tech

- Vanilla HTML / CSS / JS
- [Puter.js](https://docs.puter.com/) for authentication & (optional) cloud features
- No build step required

## Notes

- This is a **demo / educational** wallet. Balances live in `localStorage`, so they are per-browser and not shared across devices or users in a secure multi-user way.
- For a real multi-user production wallet you would need a backend database and proper authorization.
- Real cryptocurrency requires blockchain integration (e.g. ethers.js) — this project intentionally keeps things simple and admin-controlled.
- The admin password is visible in the source code (client-side). Do not use this pattern for anything valuable.

---

Made for fun. Lion vibes only. 🦁
