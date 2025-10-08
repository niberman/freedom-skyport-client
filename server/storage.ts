import { 
  Aircraft, 
  InsertAircraft, 
  ServiceRequest, 
  InsertServiceRequest,
  Service,
  InsertService,
  Membership,
  InsertMembership,
  MembershipTier,
  Profile,
  InsertProfile,
  ServiceTask,
  ActivityLog,
  Invoice,
  InvoiceLine,
  User,
  UpsertUser
} from "@shared/schema";

export interface IStorage {
  // Replit Auth User operations (required for authentication)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profiles
  getProfile(id: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  // User Roles
  getUserRoles(userId: string): Promise<string[]>;
  hasRole(userId: string, role: string): Promise<boolean>;
  
  // Aircraft
  getAircraft(id: string): Promise<Aircraft | undefined>;
  getAircraftByOwner(ownerId: string): Promise<Aircraft[]>;
  getAllAircraft(): Promise<Aircraft[]>;
  createAircraft(aircraft: InsertAircraft): Promise<Aircraft>;
  updateAircraft(id: string, aircraft: Partial<InsertAircraft>): Promise<Aircraft | undefined>;
  deleteAircraft(id: string): Promise<boolean>;
  
  // Services
  getService(id: string): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  getActiveServices(): Promise<Service[]>;
  getServicesByCategory(category: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  
  // Service Requests
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  getServiceRequestsByUser(userId: string): Promise<ServiceRequest[]>;
  getServiceRequestsByAircraft(aircraftId: string): Promise<ServiceRequest[]>;
  getAllServiceRequests(): Promise<ServiceRequest[]>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: string, request: Partial<InsertServiceRequest>): Promise<ServiceRequest | undefined>;
  deleteServiceRequest(id: string): Promise<boolean>;
  
  // Service Tasks
  getServiceTasksByAircraft(aircraftId: string): Promise<ServiceTask[]>;
  getAllServiceTasks(): Promise<ServiceTask[]>;
  createServiceTask(task: Omit<ServiceTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceTask>;
  updateServiceTask(id: string, task: Partial<ServiceTask>): Promise<ServiceTask | undefined>;
  
  // Memberships
  getMembershipByOwner(ownerId: string): Promise<Membership | undefined>;
  getAllMemberships(): Promise<Membership[]>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembership(id: string, membership: Partial<InsertMembership>): Promise<Membership | undefined>;
  
  // Membership Tiers
  getAllMembershipTiers(): Promise<MembershipTier[]>;
  getActiveMembershipTiers(): Promise<MembershipTier[]>;
  getMembershipTier(id: string): Promise<MembershipTier | undefined>;
  
  // Activity Logs
  createActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog>;
  getActivityLogsByUser(userId: string): Promise<ActivityLog[]>;
  
  // Invoices
  getInvoicesByOwner(ownerId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceLines(invoiceId: string): Promise<InvoiceLine[]>;
  createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice>;
  createInvoiceLine(line: Omit<InvoiceLine, 'id' | 'createdAt'>): Promise<InvoiceLine>;
}

// Database storage implementation using Drizzle
import { db } from "./db";
import { 
  users,
  profiles, 
  userRoles, 
  aircraft, 
  services, 
  serviceRequests, 
  serviceTasks,
  memberships,
  membershipTiers,
  activityLogs,
  invoices,
  invoiceLines
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Replit Auth User operations (required for authentication)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Profiles
  async getProfile(id: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [updated] = await db
      .update(profiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return updated;
  }

  // User Roles
  async getUserRoles(userId: string): Promise<string[]> {
    const roles = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    return roles.map(r => r.role);
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role as any)));
    return !!userRole;
  }

  // Aircraft
  async getAircraft(id: string): Promise<Aircraft | undefined> {
    const [plane] = await db.select().from(aircraft).where(eq(aircraft.id, id));
    return plane;
  }

  async getAircraftByOwner(ownerId: string): Promise<Aircraft[]> {
    return await db.select().from(aircraft).where(eq(aircraft.ownerId, ownerId));
  }

  async getAllAircraft(): Promise<Aircraft[]> {
    return await db.select().from(aircraft);
  }

  async createAircraft(plane: InsertAircraft): Promise<Aircraft> {
    const [newAircraft] = await db.insert(aircraft).values(plane).returning();
    return newAircraft;
  }

  async updateAircraft(id: string, plane: Partial<InsertAircraft>): Promise<Aircraft | undefined> {
    const [updated] = await db
      .update(aircraft)
      .set({ ...plane, updatedAt: new Date() })
      .where(eq(aircraft.id, id))
      .returning();
    return updated;
  }

  async deleteAircraft(id: string): Promise<boolean> {
    const result = await db.delete(aircraft).where(eq(aircraft.id, id));
    return result.rowCount > 0;
  }

  // Services
  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getActiveServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true));
  }

  async getServicesByCategory(category: string): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.category, category));
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined> {
    const [updated] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updated;
  }

  // Service Requests
  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id));
    return request;
  }

  async getServiceRequestsByUser(userId: string): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests).where(eq(serviceRequests.userId, userId));
  }

  async getServiceRequestsByAircraft(aircraftId: string): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests).where(eq(serviceRequests.aircraftId, aircraftId));
  }

  async getAllServiceRequests(): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests);
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [newRequest] = await db.insert(serviceRequests).values(request).returning();
    return newRequest;
  }

  async updateServiceRequest(id: string, request: Partial<InsertServiceRequest>): Promise<ServiceRequest | undefined> {
    const [updated] = await db
      .update(serviceRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
    return updated;
  }

  async deleteServiceRequest(id: string): Promise<boolean> {
    const result = await db.delete(serviceRequests).where(eq(serviceRequests.id, id));
    return result.rowCount > 0;
  }

  // Service Tasks
  async getServiceTasksByAircraft(aircraftId: string): Promise<ServiceTask[]> {
    return await db.select().from(serviceTasks).where(eq(serviceTasks.aircraftId, aircraftId));
  }

  async getAllServiceTasks(): Promise<ServiceTask[]> {
    return await db.select().from(serviceTasks);
  }

  async createServiceTask(task: Omit<ServiceTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceTask> {
    const [newTask] = await db.insert(serviceTasks).values(task as any).returning();
    return newTask;
  }

  async updateServiceTask(id: string, task: Partial<ServiceTask>): Promise<ServiceTask | undefined> {
    const [updated] = await db
      .update(serviceTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(serviceTasks.id, id))
      .returning();
    return updated;
  }

  // Memberships
  async getMembershipByOwner(ownerId: string): Promise<Membership | undefined> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.ownerId, ownerId), eq(memberships.active, true)));
    return membership;
  }

  async getAllMemberships(): Promise<Membership[]> {
    return await db.select().from(memberships);
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const [newMembership] = await db.insert(memberships).values(membership).returning();
    return newMembership;
  }

  async updateMembership(id: string, membership: Partial<InsertMembership>): Promise<Membership | undefined> {
    const [updated] = await db
      .update(memberships)
      .set({ ...membership, updatedAt: new Date() })
      .where(eq(memberships.id, id))
      .returning();
    return updated;
  }

  // Membership Tiers
  async getAllMembershipTiers(): Promise<MembershipTier[]> {
    return await db.select().from(membershipTiers);
  }

  async getActiveMembershipTiers(): Promise<MembershipTier[]> {
    return await db.select().from(membershipTiers).where(eq(membershipTiers.isActive, true));
  }

  async getMembershipTier(id: string): Promise<MembershipTier | undefined> {
    const [tier] = await db.select().from(membershipTiers).where(eq(membershipTiers.id, id));
    return tier;
  }

  // Activity Logs
  async createActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log as any).returning();
    return newLog;
  }

  async getActivityLogsByUser(userId: string): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs).where(eq(activityLogs.userId, userId));
  }

  // Invoices
  async getInvoicesByOwner(ownerId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.ownerId, ownerId));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceLines(invoiceId: string): Promise<InvoiceLine[]> {
    return await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId));
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice as any).returning();
    return newInvoice;
  }

  async createInvoiceLine(line: Omit<InvoiceLine, 'id' | 'createdAt'>): Promise<InvoiceLine> {
    const [newLine] = await db.insert(invoiceLines).values(line as any).returning();
    return newLine;
  }
}

export const storage = new DatabaseStorage();
