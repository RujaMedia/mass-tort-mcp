# Mass Tort Litigation MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server providing real-time mass tort litigation data for AI agents and applications.

## 🔗 Endpoint

```
POST https://ruja-media-mcp.shaunrgordon.workers.dev/mcp
```

Discovery: `/.well-known/mcp.json`

## 📊 Available Tools

| Tool | Description |
|------|-------------|
| `get_litigation_stats` | Get current case counts, MDL status, and key statistics for Depo-Provera/meningioma litigation |
| `check_eligibility` | Check basic eligibility criteria for mass tort claims |
| `get_state_sol` | Get statute of limitations for personal injury claims by state |
| `check_pfas_water` | Check PFAS contamination levels by zip code using EPA UCMR 5 data |
| `get_suboxone_stats` | Get Suboxone dental injury litigation statistics (MDL 3092) |
| `get_silicosis_stats` | Get countertop silicosis litigation statistics |
| `get_hair_relaxer_stats` | Get hair relaxer cancer litigation statistics (MDL 3060) |
| `get_cpap_stats` | Get CPAP/Philips recall litigation statistics (MDL 3014) |

## 🏗️ Architecture

- **Runtime:** Cloudflare Workers
- **Protocol:** JSON-RPC 2.0 (MCP standard)
- **Data Sources:** FDA safety alerts, EPA UCMR 5 data, JPML case statistics, court filings
- **Cost:** Free tier — no API key required

## 📡 JSON API

REST API also available at:
```
https://ruja-media-api.shaunrgordon.workers.dev/v1/
```

Endpoints:
- `/v1/depo-provera/stats`
- `/v1/glp1/stats`
- `/v1/pfas/stats`
- `/v1/suboxone/stats`
- `/v1/silicosis/stats`
- `/v1/hair-relaxer/stats`
- `/v1/cpap/stats`
- `/v1/states/{code}`
- `/v1/qualify`

## 🔍 Coverage

12 active mass tort litigation tracks covering pharmaceutical injuries, medical device defects, environmental contamination, and consumer protection cases across all 50 US states.

## 📄 License

MIT

## 🏢 About

Built and maintained by [Ruja Media LLC](https://rujamedia.com) — a Dallas-based legal data infrastructure company operating a network of mass tort informational properties.
