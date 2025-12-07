---
sidebar_position: 2
title: Projects API
description: Manage projects via REST API
---

# Projects API

## List Projects

```http
GET /api/projects
Authorization: Bearer TOKEN
```

Response:
```json
{
  "projects": [
    {
      "id": "abc123",
      "name": "My Project",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

## Create Project

```http
POST /api/projects
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "New Project"
}
```

## Get Project

```http
GET /api/projects/:id
Authorization: Bearer TOKEN
```

## Delete Project

```http
DELETE /api/projects/:id
Authorization: Bearer TOKEN
```
