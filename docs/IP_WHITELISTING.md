# IP Whitelisting & Blacklisting

## Overview

IP whitelisting and blacklisting allow you to control which IP addresses can access your tunnels. This is a critical security feature for production deployments.

---

## Features

### IP Whitelist
- **Allow specific IPs** to access your tunnel
- **Block all other IPs** by default
- Supports individual IPs and CIDR ranges
- IPv4 and IPv6 support

### IP Blacklist
- **Block specific IPs** from accessing your tunnel
- **Allow all other IPs** by default
- Takes precedence over whitelist
- Supports individual IPs and CIDR ranges

---

## Usage

### API Endpoints

#### Update IP Whitelist
```http
PUT /api/tunnels/:id/ip-whitelist
Authorization: Bearer <token>
Content-Type: application/json

{
  "ipWhitelist": [
    "192.168.1.100",
    "10.0.0.0/8",
    "2001:db8::/32"
  ]
}
```

#### Update IP Blacklist
```http
PUT /api/tunnels/:id/ip-blacklist
Authorization: Bearer <token>
Content-Type: application/json

{
  "ipBlacklist": [
    "203.0.113.0/24",
    "198.51.100.50"
  ]
}
```

### CLI Commands

```bash
# Set IP whitelist
arm tunnel:ip-whitelist <tunnel-id> --add 192.168.1.100
arm tunnel:ip-whitelist <tunnel-id> --add 10.0.0.0/8

# Set IP blacklist
arm tunnel:ip-blacklist <tunnel-id> --add 203.0.113.0/24

# Remove from whitelist
arm tunnel:ip-whitelist <tunnel-id> --remove 192.168.1.100

# Clear whitelist (allow all)
arm tunnel:ip-whitelist <tunnel-id> --clear
```

---

## Supported Formats

### Individual IP Addresses

**IPv4:**
```
192.168.1.100
10.0.0.1
203.0.113.50
```

**IPv6:**
```
2001:db8::1
fe80::1
::1
```

### CIDR Ranges

**IPv4 CIDR:**
```
192.168.1.0/24    # 192.168.1.0 - 192.168.1.255 (256 addresses)
10.0.0.0/8        # 10.0.0.0 - 10.255.255.255 (16M addresses)
172.16.0.0/12     # 172.16.0.0 - 172.31.255.255 (1M addresses)
```

**IPv6 CIDR:**
```
2001:db8::/32     # 2001:db8:: - 2001:db8:ffff:ffff:ffff:ffff:ffff:ffff
fe80::/10         # Link-local addresses
```

---

## Examples

### Example 1: Allow Only Office IPs

```json
{
  "ipWhitelist": [
    "203.0.113.0/24",      // Office network
    "198.51.100.50",       // VPN server
    "192.0.2.100"          // Admin home IP
  ]
}
```

**Result:** Only requests from these IPs can access the tunnel.

### Example 2: Block Specific Countries/Regions

```json
{
  "ipBlacklist": [
    "185.220.100.0/22",    // Known bad actor range
    "45.142.120.0/22",     // Spam source
    "91.219.236.0/22"      // DDoS source
  ]
}
```

**Result:** These IP ranges are blocked, all others allowed.

### Example 3: Combined Whitelist + Blacklist

```json
{
  "ipWhitelist": [
    "10.0.0.0/8"           // Allow entire corporate network
  ],
  "ipBlacklist": [
    "10.0.50.100"          // But block this specific compromised machine
  ]
}
```

**Result:** Blacklist takes precedence. All 10.0.0.0/8 IPs allowed except 10.0.50.100.

---

## How It Works

### Request Flow

```
1. Request arrives at tunnel
2. Extract client IP (handles proxies via X-Forwarded-For)
3. Check blacklist first
   - If IP in blacklist → 403 Forbidden
4. Check whitelist
   - If whitelist empty → Allow (no restriction)
   - If IP in whitelist → Allow
   - If IP not in whitelist → 403 Forbidden
5. Process request normally
```

### Priority Order

1. **Blacklist** (highest priority)
2. **Whitelist** (second priority)
3. **Default allow** (if no lists configured)

---

## Proxy & Load Balancer Support

The middleware automatically handles proxies and load balancers:

### Supported Headers

- `X-Forwarded-For` - Standard proxy header
- `X-Real-IP` - nginx proxy header
- `socket.remoteAddress` - Direct connection fallback

### Example with nginx

```nginx
location / {
    proxy_pass http://tunnel-backend;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## Common Use Cases

### 1. Corporate VPN Only

```json
{
  "ipWhitelist": ["10.0.0.0/8", "172.16.0.0/12"]
}
```

### 2. Specific Partners/Vendors

```json
{
  "ipWhitelist": [
    "203.0.113.0/24",  // Partner A
    "198.51.100.0/24", // Partner B
    "192.0.2.50"       // Vendor C
  ]
}
```

### 3. Block Known Attackers

```json
{
  "ipBlacklist": [
    "185.220.100.0/22",
    "45.142.120.0/22",
    "91.219.236.0/22"
  ]
}
```

### 4. Development Environment

```json
{
  "ipWhitelist": [
    "127.0.0.1",       // Localhost
    "::1",             // IPv6 localhost
    "192.168.1.0/24"   // Local network
  ]
}
```

### 5. Staging with Team Access

```json
{
  "ipWhitelist": [
    "203.0.113.100",   // Office
    "198.51.100.50",   // VPN
    "192.0.2.0/24"     // Remote team
  ]
}
```

---

## Error Responses

### Blacklisted IP

```json
{
  "error": "Forbidden",
  "message": "Your IP address is blocked",
  "ip": "203.0.113.50"
}
```

**HTTP Status:** `403 Forbidden`

### Not Whitelisted

```json
{
  "error": "Forbidden",
  "message": "Your IP address is not authorized",
  "ip": "198.51.100.100"
}
```

**HTTP Status:** `403 Forbidden`

---

## Validation

### Valid Entries

✅ `192.168.1.100` - IPv4 address  
✅ `10.0.0.0/8` - IPv4 CIDR  
✅ `2001:db8::1` - IPv6 address  
✅ `fe80::/10` - IPv6 CIDR  

### Invalid Entries

❌ `192.168.1` - Incomplete IP  
❌ `10.0.0.0/33` - Invalid CIDR (>32 for IPv4)  
❌ `not-an-ip` - Invalid format  
❌ `192.168.1.0/` - Missing CIDR bits  

---

## Best Practices

### Security

1. **Use whitelist for sensitive tunnels** - Explicitly allow only trusted IPs
2. **Combine with authentication** - IP filtering + OAuth/OIDC for defense in depth
3. **Regular audits** - Review and update IP lists monthly
4. **Monitor blocked requests** - Track 403 errors to detect attacks
5. **Use CIDR ranges** - More maintainable than individual IPs

### Performance

1. **Keep lists small** - Large lists slow down request processing
2. **Use CIDR ranges** - More efficient than many individual IPs
3. **Cache tunnel config** - Reduce database queries
4. **Consider CDN** - Use Cloudflare for DDoS protection

### Maintenance

1. **Document IP sources** - Comment why each IP is whitelisted
2. **Set expiration dates** - Remove temporary IPs after projects end
3. **Automate updates** - Use API to sync with corporate IP management
4. **Test before deploying** - Verify you don't lock yourself out

---

## Troubleshooting

### Problem: Can't access tunnel after setting whitelist

**Cause:** Your IP is not in the whitelist

**Solution:**
```bash
# Check your current IP
curl https://api.ipify.org

# Add it to whitelist
curl -X PUT https://api.arm.dev/tunnels/:id/ip-whitelist \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ipWhitelist": ["YOUR_IP_HERE"]}'
```

### Problem: 403 errors from load balancer

**Cause:** Load balancer IP being checked instead of client IP

**Solution:** Configure load balancer to send `X-Forwarded-For` header

### Problem: IPv6 addresses not working

**Cause:** IPv6 format not recognized

**Solution:** Use full IPv6 format or compressed format correctly
```
✅ 2001:db8::1
✅ 2001:0db8:0000:0000:0000:0000:0000:0001
❌ 2001:db8:1 (invalid)
```

---

## API Reference

### Validation Response

```json
{
  "valid": false,
  "errors": [
    "Invalid IP or CIDR format at index 0: 192.168.1",
    "Entry at index 2 must be a string"
  ]
}
```

### Success Response

```json
{
  "msg": "IP whitelist updated successfully",
  "ipWhitelist": [
    "192.168.1.100",
    "10.0.0.0/8"
  ]
}
```

---

## Integration with Other Features

### With Rate Limiting

IP whitelisting + rate limiting provides layered protection:
```json
{
  "ipWhitelist": ["203.0.113.0/24"],
  "rateLimit": {
    "enabled": true,
    "requestsPerMinute": 100
  }
}
```

### With Authentication

Combine IP filtering with OAuth for maximum security:
```json
{
  "ipWhitelist": ["10.0.0.0/8"],
  "authentication": {
    "enabled": true,
    "type": "oauth",
    "oauth": {
      "provider": "google"
    }
  }
}
```

---

## Future Enhancements

- [ ] Geo-blocking by country
- [ ] Automatic IP reputation checking
- [ ] Dynamic IP lists from threat intelligence feeds
- [ ] IP allowlist templates (AWS, GCP, Azure ranges)
- [ ] Time-based IP access (allow only during business hours)
- [ ] IP access analytics and reporting

---

## References

- [CIDR Notation](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing)
- [IPv6 Address Format](https://en.wikipedia.org/wiki/IPv6_address)
- [X-Forwarded-For Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For)
