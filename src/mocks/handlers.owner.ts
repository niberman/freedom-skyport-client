import { http, HttpResponse } from "msw";

export const ownerHandlers = [
  // owner overview for KPIs + fleet + activity
  http.get("/api/owner/overview", () =>
    HttpResponse.json({
      kpis: {
        mrr_usd: 19250,
        active_aircraft: 4,
        members: 12,
        utilization_30d: 0.62,
      },
      aircraft: [
        { tail: "N123FA", type: "SR22T", status: "Ready", next_due: "Oil in 12h" },
        { tail: "N77RG",  type: "DA50 RG", status: "MX",    next_due: "Annual in 28d" },
      ],
      activity: [
        { ts: new Date().toISOString(), who: "Vector MX", what: "WO #482 closed (SR22T oil+filters)" },
        { ts: new Date().toISOString(), who: "Sean",      what: "Logged 1.5h dual given (N123FA)" },
      ],
    })
  ),

  // billing preview shown on dashboard
  http.get("/api/owner/billing/preview", () =>
    HttpResponse.json({
      period: { start: "2025-09-01", end: "2025-09-30" },
      lines: [
        { item: "Hangar Membership (12)", qty: 1,  unit_price: 12000, total: 12000 },
        { item: "TKS Fluid",              qty: 18, unit_price: 22,    total: 396   },
        { item: "O2 Top-offs",            qty: 6,  unit_price: 35,    total: 210   },
        { item: "Detailing (SR22T)",      qty: 3,  unit_price: 250,   total: 750   },
      ],
      subtotal: 13356,
      tax: 0,
      total: 13356,
    })
  ),
];