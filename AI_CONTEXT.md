# AI_CONTEXT.md  
# AI Context for Bruno’s IMS – Recipe, SOP, Training & Menu Engineering Suite

This file is the **single source of truth** for all AI agents (ChatGPT, GitHub Copilot, custom agents) working on this repository.

It defines:
- Vision
- Core features
- Modules & workflows
- Architecture (high level)
- Data model overview
- UX layout (web + mobile)
- Roadmap & priorities
- Rules for how AI should behave

Any future changes to the system design **must** be reflected here so AI stays aligned.


---

## 1. Vision

Build a **world-class, chef-centric system** that combines:

- Professional **recipe management** (with yield, costing, nutrition, allergens)
- **SOP generation** with branded templates (like MEMES CK, but better)
- **Menu engineering** and sales analysis for external clients
- **Training & certification** (courses, quizzes, certificates)
- **Task & workflow management** (Asana-style boards)
- **AI agents** that:
  - turn voice + photos into structured recipes & SOPs
  - analyse sales and costing, explaining WHY performance changes
  - suggest actions (pricing, menu changes, improvements)

The app is first for **Chef Bruno’s own use** but must be robust enough to scale to clients, with multi-tenant separation and role-based access.

Key philosophy:  
> “Chef talks and works naturally; AI + automation handle structure, costing, documentation, and learning.”


---

## 2. Users & Roles

### 2.1. Roles

- **Owner / Super Admin (Bruno)**
  - Full access to all clients, modules, settings
  - Can see and edit all recipes, costs, templates, training, tasks
  - Can manage users, roles, and demo data

- **Client Admin**
  - Limited to a specific client (company)
  - Manages their recipes, SOPs, staff, training, menu analysis
  - Cannot see other clients’ data

- **Staff / Chef User**
  - Can view recipes, SOPs, training
  - Can record production / usage / notes
  - Restricted editing depending on permissions

- **Read-Only / Trainee**
  - Can access training, read SOPs/recipes
  - No editing, no export

### 2.2. Constraints

- Initially **~10 real users** are sufficient.
- System should be architected to **scale to many more** later, but early focus is **quality, UX, and workflow** for Bruno.

- Some views (recipes, SOPs) must **not allow export/print** for certain roles.
- First login: user must accept **consent / non-leak terms** (logged in DB).


---

## 3. Core Modules & Features

### 3.1. Master Data & Ingredients

- Ingredients with:
  - Name, category, cuisine tags
  - Base unit (g, ml, pcs, etc.)
  - Yield factors (trim, cooking loss)
  - Supplier mapping + active price
  - Nutrition per 100 g/ml (kcal, macros, sodium, etc.)
  - Allergen flags and dietary tags (contains gluten, milk, nuts, etc.)

- Global ingredient DB will **leverage external food databases** in future; for now, support manual + import.

---

### 3.2. Recipes & Production

- Recipe types:
  - Raw/semi-finished (stocks, sauces, doughs)
  - Finished menu items
  - Demo / R&D recipes

- Each recipe includes:
  - Ingredients list (linked to master data)
  - Gross / net quantities + yield
  - Portion size (per piece, per plate, per 100 g)
  - Cuisine (Italian, French, Oriental, Thai, Chinese, Indian, American, Fusion, R&D)
  - Brand / concept tags (CK bakery, main, etc.)
  - Station (hot, cold, pastry, bar)
  - Storage + shelf life
  - Allergens & nutrition (auto-calculated)
  - Status: `Active | R&D | Archived`

- Functionality:
  - Autocalc **cost per portion** and **cost per batch**
  - Versioning:
    - Every change logs who/when/why
    - Ability to compare versions
  - “R&D” status for in-progress recipes which:
    - are fully costed
    - **excluded from main menu** until promoted

---

### 3.3. Quote Requests & Price Management

- From the app, owner selects a list of ingredients and generates a **Quote Request (QR)** file:
  - Export as Excel/CSV or branded sheet/PDF for suppliers
  - Contains ingredient codes, names, UOM, current prices

- Supplier fills in prices and returns file.

- App can **re-import**:
  - Matches ingredients by code/name
  - Shows comparison: old vs new price, % change
  - User can **accept/reject** per line or per supplier

- Once accepted:
  - Ingredient price table is updated
  - All related recipe costs and menu margins auto-recalculate

- Monthly “Run price checker”:
  - Scheduled AI process scans:
    - Biggest cost changes
    - Items now unprofitable
  - Produces a summary report:
    - Why food cost % moved
    - Suggests new prices or recipe/portion changes


---

### 3.4. Menu Engineering & Client Analysis

- Client sends:
  - Filled template (or POS exports):
    - Item name, category, cost, selling price
    - Sales quantities per period, outlet/branch

- System imports and maps:
  - AI-assisted name matching (typos, variants)
  - Link external names to internal recipes when possible

- Outputs:
  - Item-level profitability
  - Menu engineering matrix:
    - Stars, Plowhorses, Puzzles, Dogs
  - Trends over time for sales, revenue, margin
  - Category breakdowns:
    - e.g., Pizza vs Pasta vs Desserts vs Drinks
  - AI narrative:
    - Why some items went up/down
    - Recommendations: reprice, reposition, bundle, drop

- Generates **client-ready summary reports** (PDF/HTML) in simple language.


---

### 3.5. SOP Engine & Templates

- SOP = **structured, printable card** based on recipe + brand design.

- Inputs:
  - Recipe (ingredients, yields)
  - Steps (production instructions)
  - Brand:
    - Logo
    - Colors
    - Optional fonts

- Output:
  - MEMES-style card layout (improved):
    - Top strip: prep time, category, storage, yield, shelf life
    - Ingredients: left side table
    - Steps: right side tiles with photos
  - Many template variations (target: **100+ templates**):
    - Layout variations (2-column, 3-column, image emphasis, text emphasis)
    - Brand variants

- Library:
  - Template browser with previews and pricing tiers
  - Clients can be **charged based on templates used** (future business logic)

- SOPs are versioned; linked to recipes and training.


---

### 3.6. Training & Certification

- Course builder:
  - Group SOPs and recipes into modules
  - Add explanatory text + images + short videos
  - Build quizzes:
    - Multiple choice, True/False, image-based

- Learner flow:
  - Enroll staff into courses
  - Track progress, scores, pass/fail

- Certificates:
  - Branded with company logo
  - Course name, user name, date, unique ID/QR
  - Export as PDF

- Reporting:
  - Training logs for audits
  - Expiry dates / recertification reminders


---

### 3.7. Task & Workflow (Asana-style)

- Kanban board:
  - Columns: Backlog, In Progress, Under Review, Done

- Tasks:
  - Linked to recipes, SOPs, training, menu projects
  - Fields:
    - Title, description
    - Assignee
    - Due date
    - Status
    - Attachments (docs, videos, screenshots)
  - Comment thread per task

- AI assistant:
  - Suggests tasks automatically when:
    - New recipe has no SOP
    - Costs change but prices not updated
    - Training required on new SOP


---

### 3.8. Demo Mode & Library

- Demo dataset:
  - ~1000 recipes:
    - ~700 CK bakery
    - ~300 main recipes for 7–9 cuisines
  - Used for:
    - Demonstrations
    - Learning sandbox
    - Testing features

- `Demo mode` toggle:
  - ON: show demo data (optionally hide real client data)
  - OFF: show only real data

- R&D section:
  - Recipes under development
  - Full costing & data
  - Hidden from non-owner users unless specifically shared


---

### 3.9. ESP32 & Hardware Integration (Future)

- ESP32 (or similar) is **NOT main server**; it is a **bridge** device:
  - Can host a tiny local status page
  - Can act as mic/voice gateway:
    - Capture voice notes and forward to backend
  - Can integrate with sensors (e.g., HACCP probes) in future

- Main application runs on:
  - Cloud server / mini PC / home lab node
  - GitHub remains code + config, not live DB


---

## 4. Architecture (High Level)

### 4.1. Overall

- **Backend API**
  - Node.js (TypeScript – can be NestJS or Express)
  - Exposes REST endpoints defined in `OPENAPI.yaml`
  - Connects to PostgreSQL (preferred) or MySQL
  - Handles:
    - Auth, roles, tenants
    - Recipes, ingredients, SOPs, training, tasks
    - File import/export
    - AI request orchestration

- **Web App**
  - React + Vite / Next.js (SPA or SSR)
  - Admin & power-user interface
  - Full features across all modules

- **Mobile App**
  - Flutter or React Native (later phase)
  - Focus on daily operations:
    - Recipe viewing
    - SOP access
    - Tasks
    - Training consumption
    - Voice/photo capture for new recipes

- **Database**
  - PostgreSQL
  - Multi-tenant structure:
    - Shared schema with `client_id` scoping
  - Proper indexing for analytics

- **Storage**
  - Object storage (S3 or equivalent) for:
    - Photos
    - PDFs
    - Training videos

- **AI Integration**
  - OpenAI API (or compatible)
  - Separate service / module for:
    - Recipe extraction from voice
    - SOP text drafting
    - Menu engineering explanations
    - Task suggestions

- **CI/CD**
  - GitHub Actions:
    - CI: lint, test, build for `apps/api` & `apps/web`
    - CD: build Docker images and deploy to server (future)


---

## 5. UX Layout – Web

### 5.1. Shell

- **Left sidebar** (fixed):
  - Logo + “Bruno’s IMS”
  - Menu:
    - Dashboard
    - Recipes
    - SOPs
    - Menu Engineering
    - Training
    - Tasks
    - Settings/Admin

- **Top bar**:
  - Client/outlet selector
  - Date range filters
  - User avatar + role

- **Main content**:
  - Card-based, responsive layout
  - Clean, minimal, professional look


### 5.2. Key Pages

#### Dashboard
- Summary cards:
  - Today’s prep load
  - Food cost vs target
  - Training alerts
  - Open tasks
- Charts:
  - Food cost trend
  - Top/worst performers
  - Key alerts

#### Recipes
- Left: filters & list
  - Search
  - Cuisine / category / status filters
  - Recipe cards with photo, cuisine, cost
- Right: selected recipe detail tabs:
  - Overview
  - Ingredients & Cost
  - Steps
  - SOP
  - Training/Tasks

#### SOPs
- Card grid with SOP previews
- Filter by client, station, type
- SOP viewer with:
  - header strip
  - ingredients table
  - step tiles
- Actions: Edit, Duplicate, Download PDF

#### Training
- Course list
- Course detail with modules & quiz
- Trainee results / export

#### Tasks
- Kanban board:
  - Backlog, In Progress, Review, Done
- Task detail panel with comments & links

#### Settings/Admin
- User & role management
- Client setup
- Brand config (logos, colors)
- Demo mode toggle


---

## 6. UX Layout – Mobile (Android / iOS)

- **Bottom tabs**:
  - Home
  - Recipes
  - Tasks
  - Training
  - Profile

### Home
- High-level cards (today’s prep, alerts, training reminders)

### Recipes
- Search + filters
- Recipe cards (photo, title, cuisine, cost)
- Detail screen:
  - Info, Ingredients, Method, SOP, Tasks

### Tasks
- List of tasks grouped by status
- Task detail with comments & linked recipe/SOP

### Training
- “My Courses” and “All Courses” for admins

### Profile
- Role, outlets, consent log, preferences


---

## 7. Data Model Overview (High Level)

**Entities (simplified):**

- `User`
  - id, name, email, role, client_id, consent_accepted_at, etc.

- `Client`
  - id, name, branding, settings

- `Ingredient`
  - id, name, category, cuisine_tags, base_unit, yield, nutrition, allergens

- `Supplier`
  - id, name, contact

- `SupplierPrice`
  - id, ingredient_id, supplier_id, price, currency, valid_from, valid_to

- `Recipe`
  - id, client_id, name, cuisine, category, station, status, yield, portion_size, storage, shelf_life, brand_tags, etc.

- `RecipeIngredient`
  - recipe_id, ingredient_id, gross_qty, net_qty, unit

- `RecipeVersion`
  - id, recipe_id, version_number, change_log, created_by, created_at

- `SOP`
  - id, recipe_id, client_id, template_id, version, layout_config, pdf_url

- `Template`
  - id, name, type, config_json, price_type, price_amount

- `Course`, `Module`, `Lesson`, `Quiz`, `Question`, `Answer`, `Result`

- `Task`
  - id, client_id, title, description, status, assignee_id, due_date, linked_recipe_id, linked_sop_id, etc.

- `QuoteRequest`, `QuoteLine`
  - for supplier price updates

- `MenuItem`, `MenuPerformance`
  - for menu engineering and sales analysis


---

## 8. Roadmap & Phases (High Level)

**Phase 1 – Backend Core**
- User & auth (multi-tenant)
- Ingredients + recipes (costing, versions)
- Basic SOP generation (no template marketplace yet)
- Quote requests & price update
- API endpoints matching core feature set

**Phase 2 – Web App**
- Full desktop UI as described
- Recipes, SOPs, Tasks, Training, Menu Engineering pages
- PDF exports

**Phase 3 – Mobile App**
- Android/iOS with recipe, SOP, task, training support
- Voice/photo capture for new recipes

**Phase 4 – Advanced AI & Templates**
- Template marketplace logic
- AI recipe extractor from voice + photos
- AI menu explanations + suggestions
- GitHub-driven automation agents

**Phase 5 – Hardware Integration**
- ESP32 bridge for voice capture or local control
- Sensor logging (optional later)


---

## 9. Behaviour Rules for AI & Copilot (Summary)

- Always follow this `AI_CONTEXT.md` as the **master spec**.
- Before designing or changing any API/module:
  - Check `OPENAPI.yaml`, `DATA_MODEL`, and this file.
- Preserve separation:
  - Backend in `apps/api`
  - Web in `apps/web`
  - Shared types/utils in `packages/common` (if created).
- Every new feature should:
  - Respect multi-tenant model (client_id)
  - Respect roles & permissions
  - Avoid leaking data between clients
- When in doubt:
  - Prefer **clarity and structure** over cleverness.
  - Keep UX simple and chef-friendly.


---
## 10. Enterprise Scope & External Inspirations

Bruno’s IMS is no longer only a "recipe + SOP + menu engineering" tool.  
It is an **industrial, all-in-one operations platform** for multi-unit F&B groups, covering:

- Back-of-house F&B ops (like Oracle Restaurant Inventory + Apicbase)
- Accounting + back office (inspired by Restaurant365)
- HR & workforce (similar to Zoho People / BambooHR)
- Central kitchen & warehouse
- B2B logistics & routing
- Workflow management (Asana / Monday / Jolt style)
- Asset & maintenance (UpKeep / Limble style)
- IT service management (ServiceNow / Jira Service Management style)

We intentionally benchmark against:

- **Oracle Simphony + Restaurant Inventory Management** for menu, stock, forecasting & multi-site control.
- **Apicbase** for chef-level recipe, allergen, nutrition & menu management.
- **Restaurant365 / MarketMan / CrunchTime** for restaurant ERP, food cost, scheduling, and accounting integration.
- **Zoho People, Rippling, BambooHR, Gusto** for HR core, time/attendance, onboarding, HR helpdesk.
- **ShipBob, Cin7, Blue Yonder, Odoo, Route4Me, Onfleet** for warehouse, routing, and B2B logistics.
- **7shifts, Asana, Trello, Monday, Jolt, Jira** for scheduling, workflows, and task boards.
- **UpKeep, Limble, Maximo** for asset management & maintenance.
- **ServiceNow, Jira Service Management, Freshservice** for IT tickets & incident/problem/change management.

Goal:  
> Match or exceed the **critical features** from each category, but deliver them with:
> - simpler UX
> - better AI support
> - tighter integration around F&B reality (central kitchen, outlets, warehouses, logistics, HR, IT).


## 11. Additional Enterprise Modules

### 11.1. HR & Workforce Module

Inspired by Zoho People / BambooHR / 7shifts.

Key capabilities:

- **Core HR data**
  - Employee master data
  - Roles, departments (Kitchen, FOH, CK, Warehouse, Drivers, IT, Admin)
  - Document storage (contracts, IDs, visas, certifications)

- **Time & Attendance**
  - Clock-in/out options:
    - Biometric device integration (face/fingerprint) where present
    - Mobile app with geo-location lock
    - Web kiosk mode
  - Shift & roster management (including multi-site scheduling)
  - Overtime, leave, and absence tracking

- **Payroll integration**
  - Export to external payroll systems (Gusto / ADP / local payroll tools)
  - Use labor data + sales data for productivity KPIs

- **HR Workflows & Helpdesk**
  - Ticketing for HR queries
  - Onboarding/offboarding flows with checklists
  - Training completion tied to HR profile (e.g. Food Safety Level 2)


### 11.2. Central Kitchen, Warehouse & B2B Logistics

Focus: central kitchen production, multi-warehouse, B2B deliveries to outlets or external customers.

Features:

- **Warehouse & CK Management**
  - Multiple warehouses (CK, frozen store, ambient, external 3PL)
  - Bin/location management
  - Replenishment rules (min/max, PAR levels)
  - Batch and expiry tracking
  - Production planning:
    - Based on outlet orders, forecasts, and menu

- **B2B Ordering**
  - Outlets and B2B clients can place orders:
    - via web portal
    - via internal app
  - Auto-generated pick lists and production batches
  - Support for substitutions and shortages

- **Routing & Driver Assignment**
  - Delivery routing engine:
    - Suggest optimal routes based on geography, load, time windows
  - Driver app:
    - See assigned routes & stops
    - GPS tracking and ETA updates
    - Proof of delivery (signature, photo, geotag)
  - All movements logged for audit:
    - who delivered what, when, where

- **Receiving App (for outlets / warehouses)**
  - Mobile app screen:
    - Select PO / shipment
    - Confirm quantities received (manual entry or fast buttons)
    - Scan items (barcode/QR) where available
    - Photo capture for damaged or short shipments
  - Auto reconcile:
    - update stock
    - flag variances and incidents
    - push data back to purchasing & accounting modules


### 11.3. Workflow & Ops Management

This extends the earlier Task/Kanban module into a full workflow layer.

Capabilities:

- Visual Kanban boards per department:
  - Kitchen / CK
  - HR
  - IT
  - Maintenance
  - Projects (new concept launches)

- Each board supports:
  - Custom columns (Backlog, Ready, Doing, QA, Done, etc.)
  - Tasks linked to:
    - Recipes, SOPs, courses, outlets, assets, incidents
  - SLA targets & reminders
  - Attachments, comments, mentions

- AI assistant:
  - Proposes workflows based on patterns (e.g., “new outlet onboarding” checklist)
  - Summarises boards into daily/weekly status reports


### 11.4. Asset & Maintenance Management (CMMS)

Focus: equipment health and maintenance across CK, outlets, warehouses.

Entities:

- Asset: unique equipment (oven, mixer, chiller, AC unit, vehicle)
- Asset Groups: e.g. “Ovens”, “Cold Rooms”, “Vehicles”

Features:

- **Asset registry**
  - Serial numbers, vendor, warranty, location, purchase value
- **Preventive Maintenance**
  - Schedules (run-time or calendar based)
  - Tasks auto-created and assigned to maintenance staff
- **Corrective Maintenance**
  - Tickets raised from staff (via app or web)
  - Priority, impact, status
- **Parts & Spares**
  - Optional link to inventory module for spare parts stock
- **History & Reporting**
  - Cost per asset over time
  - MTBF, downtime, etc.


### 11.5. IT Service Management (ITSM)

Focus: IT department handling tickets about devices, networks, user access, POS issues, etc.

Features:

- **Ticketing**
  - Incident, Request, Problem, Change types
  - Category (Network, Hardware, Software, Accounts, Security)
- **Workflow**
  - SLA per ticket type
  - Escalation rules
  - Change approval flows
- **Knowledge Base**
  - Standard solutions for recurring issues
- **Asset linkage**
  - Tie tickets to IT assets (POS terminal, PC, server, router)

This module borrows patterns from ServiceNow, Jira Service Management, and Freshservice, but is **simplified** and tuned for restaurant & CK operators.


## 12. Per-User AI Agents

Every human user gets a **companion AI agent**:

- Created automatically when a new user account is created.
- Bound to:
  - That user’s role (Chef, Manager, HR, IT, Driver)
  - Their allowed data (respecting permissions & client_id)
- Interaction modes:
  - Voice chat (mobile app)
  - Text chat (web & mobile)
- Capabilities:
  - Explain dashboards & KPIs in simple language
  - Guide through SOPs and processes step-by-step
  - Help fill forms (receiving, waste, incidents)
  - Generate first drafts of:
    - SOPs
    - Task lists
    - Training quiz questions
    - Maintenance checklists
  - “Coach mode” for new staff:
    - Answer “How do I…?” questions contextually within the system

Security:
- Agents must never expose data from other clients or users.
- All AI calls go through a central AI orchestration service that enforces permissions before sending any prompt/context to the model.


## 13. Hosting & Commercial Model

### 13.1. Hosting Strategy

This platform is designed primarily for **self/managed hosting per company**:

- Each client typically has **its own server/VM**, controlled by Bruno’s team.
- For small clients (<100 users), a **single powerful on-prem or colocated server** per client is sufficient.
- As the system grows:
  - Consolidate or separate hosting as needed, but design remains compatible with:
    - Docker + Docker Compose
    - Kubernetes (future)
    - GPU-accelerated nodes for AI

Each client’s stack includes:

- API backend
- Web app
- Database (PostgreSQL)
- Object storage (local or cloud)
- AI gateway (connecting to shared or dedicated models)

### 13.2. Hardware Expectations (per client, high-level)

Later, for AI-heavy clients:

- ~48 GB or more of total GPU VRAM (e.g., 2–3 GPUs depending on model choice)
- Sufficient CPU & RAM to support:
  - concurrent web users
  - training/inference jobs
- Redundant storage + backups

Exact BOM will be defined later per tier.


### 13.3. Business Model

- **Subscription model**:
  - Monthly or annual per company
  - Pricing scaled by:
    - number of locations
    - number of modules enabled
    - AI usage level (light, standard, heavy)

- Every company has:
  - Their own logically isolated database / schema
  - Their own AI “persona” tuned to their data and brand

- Support model:
  - Small core remote IT/DevOps team (2–3 people initially)
  - They maintain infrastructure, upgrades, monitoring, and support
  - Bruno defines standards, trains them, and retains final control on architectural decisions


## 14. Notes & Adjustments vs Previous Version

- ESP32 is **not part of the core hosting model** anymore.
  - It may still appear later as an optional edge device (e.g., HACCP logging, smart sensors, or voice capture), but the **main system is server-hosted** on proper hardware.
- Scope expanded significantly:
  - From primarily recipes/SOP/training/menu engineering
  - To a full restaurant group **enterprise management platform** with:
    - HR
    - CK/Warehouse/Logistics
    - B2B
    - Workflow
    - Asset & Maintenance
    - ITSM
- Per-user AI agents and per-company AI instances are now **core design elements**, **not optional extras**.

All future design and implementation decisions must reflect this **enterprise, multi-department, multi-tenant** vision, while keeping UX simple enough for real chefs, managers, and staff to use daily.
