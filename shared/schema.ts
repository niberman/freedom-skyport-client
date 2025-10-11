import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, numeric, date, pgEnum, varchar, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const appRoleEnum = pgEnum("app_role", ["owner", "admin"]);

// Replit Auth tables (required for authentication)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(),
  role: appRoleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const aircraft = pgTable("aircraft", {
  id: uuid("id").primaryKey().defaultRandom(),
  tailNumber: text("tail_number").notNull().unique(),
  model: text("model").notNull(),
  ownerId: varchar("owner_id"),
  baseLocation: text("base_location").default("KAPA"),
  status: text("status").default("active"),
  hobbsTime: numeric("hobbs_time"),
  tachTime: numeric("tach_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(),
  aircraftId: uuid("aircraft_id"),
  actionType: text("action_type").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  isActive: boolean("is_active").default(true),
  creditsRequired: integer("credits_required").default(1),
  canRollover: boolean("can_rollover").default(false),
  creditsPerPeriod: integer("credits_per_period").default(0),
  baseCreditsLowActivity: integer("base_credits_low_activity").default(0),
  baseCreditsHighActivity: integer("base_credits_high_activity").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const serviceRequests = pgTable("service_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(),
  aircraftId: uuid("aircraft_id").notNull(),
  serviceId: uuid("service_id"),
  serviceType: text("service_type").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  airport: text("airport").default("KAPA"),
  requestedDeparture: timestamp("requested_departure", { withTimezone: true }),
  fuelGrade: text("fuel_grade"),
  fuelQuantity: numeric("fuel_quantity"),
  o2Topoff: boolean("o2_topoff").default(false),
  tksTopoff: boolean("tks_topoff").default(false),
  gpuRequired: boolean("gpu_required").default(false),
  hangarPullout: boolean("hangar_pullout").default(true),
  cabinProvisioning: jsonb("cabin_provisioning"),
  isExtraCharge: boolean("is_extra_charge").default(false),
  creditsUsed: integer("credits_used").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const serviceTasks = pgTable("service_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  aircraftId: uuid("aircraft_id").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  assignedTo: uuid("assigned_to"),
  notes: text("notes"),
  photos: jsonb("photos").default([]),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const membershipTiers = pgTable("membership_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }),
  description: text("description"),
  minHoursPerMonth: numeric("min_hours_per_month", { precision: 5, scale: 2 }).default("0"),
  maxHoursPerMonth: numeric("max_hours_per_month", { precision: 5, scale: 2 }),
  creditMultiplier: numeric("credit_multiplier", { precision: 3, scale: 2 }).default("1.0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull(),
  tierId: uuid("tier_id"),
  tier: text("tier").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).defaultNow().notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const serviceCredits = pgTable("service_credits", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull(),
  serviceId: uuid("service_id").notNull(),
  creditsAvailable: integer("credits_available").default(0),
  creditsUsedThisPeriod: integer("credits_used_this_period").default(0),
  lastResetDate: timestamp("last_reset_date", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  aircraftId: uuid("aircraft_id").notNull(),
  ownerId: uuid("owner_id").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  totalCents: integer("total_cents").notNull().default(0),
  status: text("status").notNull().default("draft"),
  hostedInvoiceUrl: text("hosted_invoice_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const invoiceLines = pgTable("invoice_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity").notNull().default("1"),
  unitCents: integer("unit_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Insert schemas - create base schemas then pick required fields
const profileSchema = createInsertSchema(profiles);
const aircraftSchemaBase = createInsertSchema(aircraft);
const serviceRequestSchemaBase = createInsertSchema(serviceRequests);
const serviceSchemaBase = createInsertSchema(services);
const membershipSchemaBase = createInsertSchema(memberships);
const invoiceSchemaBase = createInsertSchema(invoices);
const invoiceLineSchemaBase = createInsertSchema(invoiceLines);

export const insertProfileSchema = profileSchema.pick({ id: true, email: true, fullName: true, phone: true });
export const insertAircraftSchema = aircraftSchemaBase.pick({ tailNumber: true, model: true, ownerId: true, baseLocation: true, status: true, hobbsTime: true, tachTime: true });
export const insertServiceRequestSchema = serviceRequestSchemaBase.pick({ userId: true, aircraftId: true, serviceId: true, serviceType: true, description: true, priority: true, status: true, airport: true, requestedDeparture: true, fuelGrade: true, fuelQuantity: true, o2Topoff: true, tksTopoff: true, gpuRequired: true, hangarPullout: true, cabinProvisioning: true, isExtraCharge: true, creditsUsed: true });
export const insertServiceSchema = serviceSchemaBase.pick({ name: true, description: true, category: true, isActive: true, creditsRequired: true, canRollover: true, creditsPerPeriod: true, baseCreditsLowActivity: true, baseCreditsHighActivity: true });
export const insertMembershipSchema = membershipSchemaBase.pick({ ownerId: true, tier: true, active: true, tierId: true, startDate: true, endDate: true });
export const insertInvoiceSchema = invoiceSchemaBase.pick({ aircraftId: true, ownerId: true, periodStart: true, periodEnd: true, totalCents: true, status: true, hostedInvoiceUrl: true });
export const insertInvoiceLineSchema = invoiceLineSchemaBase.pick({ invoiceId: true, description: true, quantity: true, unitCents: true });

// Types - using Drizzle's type inference
export type InsertProfile = typeof profiles.$inferInsert;
export type Profile = typeof profiles.$inferSelect;

export type InsertAircraft = typeof aircraft.$inferInsert;
export type Aircraft = typeof aircraft.$inferSelect;

export type InsertServiceRequest = typeof serviceRequests.$inferInsert;
export type ServiceRequest = typeof serviceRequests.$inferSelect;

export type InsertService = typeof services.$inferInsert;
export type Service = typeof services.$inferSelect;

export type InsertMembership = typeof memberships.$inferInsert;
export type Membership = typeof memberships.$inferSelect;

export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLine = typeof invoiceLines.$inferSelect;

export type MembershipTier = typeof membershipTiers.$inferSelect;
export type ServiceTask = typeof serviceTasks.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Replit Auth types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
