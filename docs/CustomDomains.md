# Custom Domain Setup Guide

This guide explains how to connect a custom domain to your Sellarity storefront.

## Overview

Each merchant can connect one custom domain (e.g., `www.mystore.com`) to serve their storefront. The custom domain will rewrite internally to `/s/[slug]` while maintaining the original URL in the browser.

## Prerequisites

- A domain name registered with a DNS provider
- Access to your domain's DNS settings
- Admin access to your Sellarity merchant account

## Setup Process

### 1. Add Your Domain

1. Go to **Dashboard → Settings → Domain**
2. Enter your domain (e.g., `www.mystore.com` or `store.example.com`)
3. Click **Save Domain**
4. A verification token will be generated

### 2. DNS Configuration

#### Option A: CNAME (Recommended)

Point your domain to the Sellarity platform:

```
Type: CNAME
Name: www (or your subdomain)
Value: [PLATFORM_BASE_URL] (provided by Sellarity)
```

#### Option B: A Record

If CNAME is not supported, use A records (contact support for IP addresses).

### 3. Verification Record

Add a TXT record to verify domain ownership:

```
Type: TXT
Name: _sellarity-verify.[your-domain]
Value: sellarity-verification=[verification-token]
```

**Example:**
- Domain: `www.mystore.com`
- TXT Record Name: `_sellarity-verify.www.mystore.com`
- TXT Record Value: `sellarity-verification=abc123...`

### 4. Verify Domain

1. Wait 5-10 minutes for DNS propagation
2. Click **Verify Domain** in the dashboard
3. System checks the TXT record
4. Status changes to **VERIFIED** when successful

### 5. Activate Domain

1. Once verified, click **Activate Domain**
2. Status changes to **ACTIVE**
3. Your storefront is now live on your custom domain!

## Domain Status

- **PENDING**: Domain saved, awaiting DNS verification
- **VERIFIED**: TXT record verified, ready to activate
- **ACTIVE**: Domain is live and serving storefront

## SSL/HTTPS

SSL certificates are automatically provisioned by the hosting platform (Vercel/Netlify). No additional configuration needed.

## Limitations

- **One domain per merchant**: Each store can connect one custom domain
- **Subdomain support**: Both root domains (`example.com`) and subdomains (`www.example.com`, `store.example.com`) are supported
- **DNS propagation**: Changes may take 5-60 minutes to propagate globally

## Troubleshooting

### Verification Fails

1. **Check DNS propagation**: Use `dig` or online DNS checkers
   ```bash
   dig TXT _sellarity-verify.www.mystore.com
   ```
2. **Verify record format**: Ensure exact format `sellarity-verification=<token>`
3. **Wait longer**: Some DNS providers take up to 24 hours

### Domain Not Loading

1. **Check domain status**: Must be **ACTIVE**
2. **Verify CNAME/A record**: Ensure DNS points to platform
3. **Check SSL**: Wait for automatic SSL provisioning (may take a few minutes)
4. **Clear cache**: Browser/DNS cache may show old records

### Common DNS Issues

- **CNAME conflicts**: Can't use CNAME on root domain (`example.com`), use subdomain (`www.example.com`)
- **TTL too high**: Lower TTL before making changes for faster propagation
- **Multiple records**: Some providers require separate records for root and www

## Security

- Domain verification prevents domain hijacking
- Only verified domains can be activated
- Admin access required for all domain operations
- Verification tokens are randomly generated and unique per merchant

## Support

For issues or questions:
- Check DNS propagation status
- Verify TXT record format
- Contact support with domain and merchant ID
