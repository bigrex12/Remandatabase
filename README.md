# KAEBS Wakarusa • Reman & Board Repair Tracker

A high-performance web application designed to track circuit boards and hardware sent out to external vendors for repair over long repair cycles (months), with complete customer provenance, non-inventoried floating stock management, reverse "mystery board" identification, and automated Google Sheet customer syncing.

---

## Key Features

1. **Dashboard & UI Matching Company Aesthetic**:
   - Dark theme styling (`#0B0F17` background, `#101624` cards, glowing indigo/purple accents).
   - Real-time KPI Metric Summary Cards (Total In-System, At Vendor, In Floating Stock, Ready to Bill).
   - Multi-filter bar: Live search by part, serial #, RMA #, farmer, markings, vendor, tech, and date range.
   - 1-Click CSV export for accounting and management.

2. **Pre-Tagged Intended Return Routing (Before Mailing Out)**:
   - When a broken board is logged before shipping, technicians pre-tag the **Intended Return Destination**:
     - 🎯 *Return to Original Farmer* (customer waiting on their board)
     - 🎯 *Place into Floating / Reman Stock* (customer already received a swap; this unit replenishes shop stock)
     - 🎯 *Designated for Another Farmer* (pre-allocated for an upcoming job)
   - When the unit returns months later, the check-in screen highlights the intended destination for 1-click confirmation.

3. **Complete 4-Way Routing System**:
   - **Route 1:** Vendor Return ➔ **Direct to Original Farmer**
   - **Route 2:** Vendor Return ➔ **Floating / Reman Stock (Shelf/Bin #)**
   - **Route 3:** Vendor Return ➔ **Direct Reassignment to New Farmer**
   - **Route 4:** **Floating Stock ➔ Deploy & Install to Farmer** (pulled from shop shelf to fix a customer's machine)

4. **"Mystery Part" Reverse Identification Assistant**:
   - When a board arrives back months later with no box, no tags, or no paper slip, use the **Mystery Part Lookup** assistant:
     - Cross-references Vendor RMA #, Packing Slip #, or Inbound Courier Tracking.
     - Matches on PCB Silk Screen / Revision # (e.g. `Rev 4.2C`), Serial fragment, or Part Name.
     - Searches distinguishing physical markings (e.g. *"Sharpie JN on connector"*, *"Burn mark near relay 2"*).
     - Compares side-by-side with original photos taken before shipping.

5. **1-Click Printable Repair Tag & QR Code**:
   - Generates a high-contrast printable repair slip / box tag with QR Code, Ticket # (`RMN-2026-XXXX`), Part Details, Serial #, Origin Farmer, and Intended Return Route.
   - Formatted for 4x6" thermal labels or standard paper.

6. **Google Sheets Customer Syncing (On App Load / Manual Refresh)**:
   - Synchronizes your customer directory with the shared Google Sheet:
     - **Col A:** `Farm ID` (e.g. `T-118`)
     - **Col B:** `Farm Name`
     - **Col C:** `Farm Phone`
     - **Col D:** `Farm Email`
     - **Col E:** `Farm Address`
     - **Col F:** `Sites`
     - **Col G:** `Date Created`
   - High-speed local SQLite cache guarantees instant autocomplete search (< 5ms) across thousands of farms.
   - Includes a **Direct Copy-Paste Tab** for instant 1-click batch import from Google Sheets.

7. **Billing & PO Reconciliation**:
   - Tracks Vendor Repair Cost vs. Customer Billing Amount, Margin, and Work Order / PO # so no repairs go unbilled.

---

## Quick Start & Running Locally

### Prerequisites
- Node.js (v18+)

### Starting the Application
```bash
# 1. Start unified production server (serves frontend + API on port 5000)
npm start

# Or start in concurrent dev mode (Vite hot-reload on 5173 + API on 5000)
npm run dev
```

Open your browser to:
```
http://localhost:5000
```

---

## Internet Hosting Options

This application is packaged as a lightweight, self-contained single service (Express + SQLite + React):

1. **Local Server with Cloudflare Tunnel (Zero Cost & Fast)**:
   - Run `cloudflared tunnel --url http://localhost:5000` to get a secure HTTPS web address accessible anywhere.
2. **Cloud Hosting (Render, Railway, DigitalOcean, Fly.io, AWS)**:
   - Connect your GitHub repository to Render or Railway.
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Set persistent disk for `server/data/` and `server/uploads/` so SQLite and photos persist indefinitely.
3. **Internal Office Windows Server**:
   - Run via PM2 or Windows Service (`nssm install KaebsRemanTracker node C:\...\server\index.js`).
