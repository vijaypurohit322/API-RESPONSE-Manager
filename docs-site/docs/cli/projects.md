---
sidebar_position: 5
title: Projects
description: Manage API response projects
---

# Project Commands

Create and manage projects for capturing and sharing API responses.

## Create a Project

```bash
arm project create <name>
```

### Example

```bash
arm project create "Payment API Testing"
```

Output:
```
✓ Project created!
  ID: payment-api-testing
  Share URL: https://tunnelapi.in/share/abc123
```

## List Projects

```bash
arm project list
```

Output:
```
ID                      Name                    Responses    Created
──────────────────────────────────────────────────────────────────────
payment-api-testing     Payment API Testing     42           2 days ago
user-auth-debug         User Auth Debug         15           1 week ago
```

## View Project Details

```bash
arm project show <project-id>
```

## Delete a Project

```bash
arm project delete <project-id>
```

## Capture API Responses

### Start Proxy

Capture API responses through the proxy:

```bash
arm proxy start --project payment-api-testing --port 3001
```

Configure your API client to use the proxy:
```
http://localhost:3001
```

### Direct Capture

Capture a single request:

```bash
arm capture --project payment-api-testing \
  --method POST \
  --url https://api.example.com/payments \
  --body '{"amount": 100}'
```

## Share Projects

### Get Share URL

```bash
arm project share <project-id>
```

Output:
```
Share URL: https://tunnelapi.in/share/abc123
Anyone with this link can view the project (read-only)
```

### Disable Sharing

```bash
arm project share <project-id> --disable
```

## Export Responses

### Export to JSON

```bash
arm project export <project-id> --format json > responses.json
```

### Export to Postman Collection

```bash
arm project export <project-id> --format postman > collection.json
```

### Export to OpenAPI

```bash
arm project export <project-id> --format openapi > openapi.yaml
```

## Collaboration

### Add Comment

```bash
arm project comment <project-id> --response <response-id> "This looks correct"
```

### View Comments

```bash
arm project comments <project-id>
```
