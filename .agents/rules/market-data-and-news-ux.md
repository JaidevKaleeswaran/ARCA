---
description: Guidelines for authentic financial news presentation, market data grounding, and cross-tab asset reactivity
trigger: always_on
---

# Market Data & Financial News Presentation Guidelines

## 1. Authentic Financial News & Primary Sourcing
- Never present synthetic or imagined summaries as primary news articles.
- All financial news items must feature authentic journalistic metadata: headline, reputable publisher attribution (e.g., Bloomberg, Reuters, WSJ, CNBC, FT, Associated Press), publication timestamp, reading time, and canonical outbound links to the original reporting.
- Provide a dedicated, readable full-article modal or reader view so users can inspect the complete reporting directly within the app.

## 2. Separation of AI Synthesis & Macro Digest
- House AI-generated summaries and economic commentary in a distinct, clearly demarcated auxiliary section (e.g., a dedicated sidebar or takeaway card).
- Frame AI analysis explicitly around *personal finance and budget implications* (e.g., impacts on high-yield cash yields, mortgage rates, grocery inflation) rather than attempting to impersonate an original news reporter.

## 3. Universal Cross-Tab Asset Reactivity
- Any financial asset tracked by the user (such as equity holdings, ETFs, or savings accounts) must reside in the global state store (`BudgetContext`) and persist seamlessly across sessions (both Guest LocalStorage and Authenticated Firestore).
- Never isolate user-entered investments to a single tab; surface them consistently across:
  - **Home Tab**: As an integrated wealth/asset widget (`StocksWidget`) alongside income settings and budget envelopes.
  - **Summary Tab**: Integrated into Net Worth calculations, Financial Health scorecards, and asset allocation visualizations.
  - **AI Assistant**: Injected into the financial snapshot context so conversational agents can accurately report on portfolio valuation and performance.

## 4. Authoritative Interest Rate & Macroeconomic Sourcing
- Never synthesize or hardcode interest rates, mortgage yields, or Federal Reserve benchmark policy rates.
- Rates must be sourced from official Federal Reserve Economic Data (FRED) series (`DFF`, `MORTGAGE30US`, `MORTGAGE15US`, `DPRIME`, `TERMCBCCALLNS`, `CPIAUCSL`, `UNRATE`) and live US Treasury sovereign debt market yields via Yahoo Finance (`^TNX`, `^IRX`, `^FVX`, `^TYX`).
- Competitive cash yields (Top HYSA APYs) must be anchored dynamically to effective Federal Reserve benchmarks (e.g. `DFF + 0.35%`).
- Provide resilient caching (15-minute TTL) with verified fallback baselines so rate degradation never renders broken UIs.

## 5. Stock Search Hygiene & Directory Quality
- Enforce strict ticker hygiene on stock search and catalog endpoints:
  - Strip foreign exchange extensions (`.TO`, `.DE`, `.MX`, `.NE`, etc.) unless specifically handling domestic share classes like `BRK.B` / `BF.B`.
  - Exclude derivative contracts, futures (`=F`), and leveraged/inverse instruments (`2X`, `3X`, `TSLZ`, `SOXS`, `NVDX`, `Ultra`) from standard company searches unless explicitly requested by the user.
  - Dynamically preserve sector classification directly from real-time quote feeds rather than falling back to generic placeholders.
  - Ensure search results bypass any active sector filters in the UI so relevant results are never hidden.
  - Correctly extract net asset capitalization (`q.netAssets || q.totalAssets`) for ETFs (e.g., `SPY`, `VOO`, `QQQ`) so funds do not display `Cap: N/A`.
