# GrocerEase -- Architecture & Planning

## Vision

Help families shop faster and smarter with a shared, deduplicated,
auto-ordered grocery list powered by store-aware maps and crowd-sourced
availability.

## Primary Users

- Household members
- In-store shopper

## Core Features

1. Collaborative lists (real-time editing, invites, comments)
2. Smart de-duplication (canonicalization, unit normalization, synonym merge)
3. Auto-ordering by store layout (aisle path, fallback layouts)
4. Store geolocation & wayfinding (geo-fence, aisle hints)
5. Crowd-sourced availability & seasonality (found/not found reports, substitutes)

## Key Screens

- Home (recent lists, household switcher)
- List Creation & Editing (ordered items, completed items, add bar)
- Shopping View (Remaining items, aisle map, "where is it?")
- Settings (household members, privacy)

## Data Model

- Users, Households, HouseholdMembers
- Stores, StoreAisles
- Lists, ListItems
- CatalogItems (canonical names, synonyms, categories, seasonality)
- ItemLocationReports, AvailabilityReports
- Barcodes, EventLogs

### Example SQL DDL

``` sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT
);

CREATE TABLE household_members (
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (household_id, user_id)
);

CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  store_hint_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  synonyms TEXT[] DEFAULT '{}',
  category TEXT,
  typical_aisles TEXT[] DEFAULT '{}',
  seasonality JSONB
);

CREATE INDEX ON catalog_items USING GIN (canonical_name gin_trgm_ops);
CREATE INDEX ON catalog_items USING GIN (synonyms);

CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  catalog_item_id UUID NULL REFERENCES catalog_items(id),
  name_text TEXT NOT NULL,
  qty NUMERIC(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'ea',
  tags JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID NULL REFERENCES users(id),
  priority TEXT DEFAULT 'normal',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

(Full schema defined in conversation.)

## Auto-ordering Algorithm

- Resolve item → catalog category
- Map to store aisles if known, else fallback layouts
- Order by aisle path, refine with crowd confirmations

## Availability & Seasonality

- Availability score per item/store
- Rolling decay for "Found", "NotFound", "Discontinued"
- Seasonality curves per region

## Tech Stack

**Client:** React + Vite + TypeScript, PWA, IndexedDB, Service Worker\
**Server:** .NET 8 Web API + SignalR\
**Database:** Azure Database for PostgreSQL + PostGIS, pg_trgm\
**Realtime:** Azure SignalR Service\
**Infra:** Azure App Service, Redis, Service Bus, Azure Functions, Blob
Storage, Azure Maps, App Insights

## Example API Endpoints

- Lists: GET /households/{id}/lists, POST /lists, GET /lists/{id},
    POST /lists/{id}/items
- Stores: GET /stores/near, GET /stores/{id}/aisles
- Crowd Data: POST /reports/location, POST /reports/availability

## Rollout Plan

- Phase 0: Prototype (PWA shell, add/complete items)
- Phase 1: Private Beta (auth, realtime, crowd reports)
- Phase 2: Broadened Beta (multi-store, comments, moderation)
- Phase 3: GA (seasonality curves, OCR, premium features)

## Azure Implementation Notes

- Postgres Flexible Server (with PostGIS + pg_trgm)
- Azure SignalR Service
- Azure Functions for background tasks
- Azure Blob for storage/CDN
- Microsoft Entra External ID for auth
- GitHub Actions + Bicep for CI/CD

## Repo Structure

  grocer-ease/
    ├─ docs/architecture.md
    ├─ api/ (.NET 8 Web API)
    ├─ client/ (React + TS PWA)
    └─ database/schema.sql
