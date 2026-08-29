# Beastcoin

**Beastcoin** is a super-simple crypto wallet website, inspired by Coinbase but stripped down to the essentials.

## Features

- **Puter.js authentication** — Users sign in with their Puter account (no passwords to manage yourself).
- **Admin-only coin management** — Only the admin can add or remove coins. Regular users cannot deposit or withdraw.
- **Clean, modern UI** — Dark theme, mobile-friendly.
- **Local storage for balances** — Balances are stored in the browser (demo-friendly). For production you would replace this with a real backend.

## How to become the Admin

1. Open `app.js`.
2. Change this line near the top:

```js
const ADMIN_USERNAME = "admin"; // <-- REPLACE with your Puter username
```

3. Set it to **your exact Puter username** (the one shown after you sign in).
4. Redeploy / refresh. When you sign in with that account you will see the Admin Controls panel.

## How it works

1. Anyone can open the site and sign in with Puter.
2. Their balance of **BEAST** coins is shown.
3. Only the admin can:
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

---

Made for fun. Lion vibes only. 🦁
