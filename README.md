# danb.id.au — Personal Homepage

Modern, accessible static homepage for Daniel Betteridge — IT support and startup consulting.

Hosted on [GitHub Pages](https://pages.github.com/) at **https://danb.id.au**.

## Local preview

Open `index.html` in a browser, or serve locally:

```bash
python -m http.server 8080
```

Then visit http://localhost:8080

## Deploy to GitHub Pages

### 1. Create the repository

1. Create a new GitHub repository (e.g. `homepage` or `danielbetteridge.github.io`).
2. Push this folder to the `main` branch.

```bash
git init
git add .
git commit -m "Initial homepage"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/homepage.git
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to **Settings → Pages** in your repository.
2. Under **Build and deployment → Source**, select **Deploy from a branch**.
3. Choose branch: `main`, folder: `/ (root)`.
4. Save.

GitHub will build and publish the site. The `CNAME` file in this repo tells GitHub Pages to serve the site at `danb.id.au`.

### 3. Configure the custom domain in GitHub

1. In **Settings → Pages → Custom domain**, enter `danb.id.au`.
2. Click **Save**.
3. Wait for the DNS check to pass (may take up to 24 hours, often much faster).
4. Once verified, enable **Enforce HTTPS**.

---

## DNS setup for danb.id.au

You'll configure DNS wherever `danb.id.au` is registered (e.g. Cloudflare, GoDaddy, VentraIP, Crazy Domains, etc.).

GitHub Pages requires these records for an apex domain (`danb.id.au`):

| Type | Host / Name | Value | TTL |
|------|-------------|-------|-----|
| **A** | `@` (or blank) | `185.199.108.153` | 3600 |
| **A** | `@` (or blank) | `185.199.109.153` | 3600 |
| **A** | `@` (or blank) | `185.199.110.153` | 3600 |
| **A** | `@` (or blank) | `185.199.111.153` | 3600 |

These four A records point the apex domain to GitHub Pages.

### Optional: www subdomain

If you also want `www.danb.id.au` to work:

| Type | Host / Name | Value | TTL |
|------|-------------|-------|-----|
| **CNAME** | `www` | `YOUR_USERNAME.github.io` | 3600 |

Replace `YOUR_USERNAME` with your GitHub username. GitHub will redirect between apex and www once configured.

> **Note:** You cannot use a CNAME on the apex domain (`danb.id.au`) — only A records work there. The `CNAME` file in this repo is for GitHub's configuration, not a DNS CNAME record.

### Email (mail@danb.id.au)

The website contact link uses `mail@danb.id.au`. DNS for **email** is separate from the website. You'll need MX records from your email provider (e.g. Google Workspace, Microsoft 365, Fastmail, Proton Mail, or your domain registrar's email service).

Example for Google Workspace:

| Type | Host | Value | Priority |
|------|------|-------|----------|
| **MX** | `@` | `ASPMX.L.GOOGLE.COM` | 1 |
| **MX** | `@` | `ALT1.ASPMX.L.GOOGLE.COM` | 5 |
| **MX** | `@` | `ALT2.ASPMX.L.GOOGLE.COM` | 5 |
| **MX** | `@` | `ALT3.ASPMX.L.GOOGLE.COM` | 10 |
| **MX** | `@` | `ALT4.ASPMX.L.GOOGLE.COM` | 10 |

You'll also need SPF, DKIM, and optionally DMARC records from your email provider for deliverability.

### Cloudflare users

If using Cloudflare:

1. Add the four A records above for `@`.
2. Set proxy status to **DNS only** (grey cloud) for the A records — GitHub Pages does not work with Cloudflare's orange-cloud proxy on apex domains without additional configuration.
3. Add the CNAME for `www` if needed, also DNS only.

### Verify DNS propagation

After adding records, check propagation:

```bash
dig danb.id.au A +short
```

You should see the four GitHub IP addresses listed above.

Or use online tools like [dnschecker.org](https://dnschecker.org/).

### Troubleshooting

| Issue | Fix |
|-------|-----|
| "Domain's DNS record could not be retrieved" | Wait for propagation; confirm all four A records are set |
| Site shows 404 | Ensure GitHub Pages is enabled and `index.html` is at repo root |
| HTTPS not available | Wait up to 24h after DNS verification; then enable Enforce HTTPS |
| CNAME conflict | Remove any existing CNAME on `@` before adding A records |

---

## File structure

```
.
├── index.html      # Main page
├── styles.css      # Styles
├── CNAME           # Custom domain for GitHub Pages
├── .nojekyll       # Skip Jekyll processing
└── README.md       # This file
```

## Accessibility

- Semantic HTML5 landmarks
- Skip-to-content link
- Sufficient colour contrast (WCAG AA)
- Visible focus indicators
- `prefers-reduced-motion` support
- Screen-reader labels for external links
