---
sidebar_position: 4
title: Integrations
description: Connect webhooks to Slack, Discord, and more
---

# Webhook Integrations

Get notified when webhooks are received.

## Slack

```bash
arm webhook create --notify-slack https://hooks.slack.com/services/xxx
```

## Discord

```bash
arm webhook create --notify-discord https://discord.com/api/webhooks/xxx
```

## Email

```bash
arm webhook create --notify-email your@email.com
```

## Custom Webhook

Forward notifications to any URL:

```bash
arm webhook create --notify-webhook https://your-service.com/notify
```
