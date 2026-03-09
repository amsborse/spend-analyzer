# Spend Analyzer — V1 Design Document

See the project design specification for:

- **Product overview** — personal finance analysis, CSV upload, normalization, categorization, dashboards
- **V1 scope** — CSV upload, parsing, categorization, searchable table, charts, drill-down (no AI in V1)
- **Target users** — professionals and individuals managing personal finances
- **User flows** — temporary session mode (upload → analyze); account mode (future)
- **Data input** — CSV with flexible headers (date, merchant, description, amount, currency, category)
- **Internal schema** — `id`, `date`, `merchant_raw`, `merchant_normalized`, `description`, `amount`, `currency`, `category`, `source`, `created_at`
- **Core modules** — CSV parser, merchant normalizer, categorizer, recurring detector, spending aggregator
- **API** — `POST /transactions/upload`, `GET /transactions`, `GET /analytics/category-breakdown`, `GET /analytics/merchant-breakdown`, `GET /analytics/monthly`
- **Frontend** — React, interactive charts (Recharts/ECharts/Chart.js), drill-down, fast filtering
- **Repo structure** — `backend`, `frontend`, `ai_features`, `documents`, `infra`
- **Docker** — API + PostgreSQL + web via `docker compose up`
- **Implementation phases** — 1: scaffolding → 2: ingestion → 3: processing → 4: analytics → 5: dashboard

Full design text is maintained in the project spec; this file is a reference outline.
