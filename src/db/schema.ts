import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  jsonb,
  date,
} from 'drizzle-orm/pg-core';

// ---------- Identity (Profiles) ----------
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(), // 'student' | 'faculty' | 'lab_admin'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Campus Graph ----------
export const campusNodes = pgTable('campus_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nodeType: text('node_type').notNull(), // 'lab' | 'building' | 'landmark'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const campusEdges = pgTable('campus_edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromNode: uuid('from_node').notNull().references(() => campusNodes.id),
  toNode: uuid('to_node').notNull().references(() => campusNodes.id),
  distanceM: numeric('distance_m').notNull(),
  weight: numeric('weight').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Labs & Resources ----------
export const labs = pgTable('labs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nodeId: uuid('node_id').references(() => campusNodes.id),
  capacity: integer('capacity').notNull().default(0),
  labCode: text('lab_code').unique(),
  investment: numeric('investment', { precision: 14, scale: 2 }),
});

export const resources = pgTable('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  labId: uuid('lab_id').notNull().references(() => labs.id),
  label: text('label').notNull(),
  state: text('state').notNull().default('AVAILABLE'), // AVAILABLE, RESERVED, ALLOCATED, RELEASING, MAINTENANCE
  version: integer('version').notNull().default(0),
  batchId: uuid('batch_id'),
  serialNo: text('serial_no'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Bookings (Authoritative Record) ----------
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id),
  labId: uuid('lab_id').notNull().references(() => labs.id),
  resourceId: uuid('resource_id').references(() => resources.id),
  state: text('state').notNull().default('REQUESTED'),
  priority: integer('priority').notNull().default(2),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Scheduling Decisions ----------
export const schedulingDecisions = pgTable('scheduling_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id),
  requestId: text('request_id').notNull(),
  policy: text('policy').notNull(), // FCFS | SJF | ROUND_ROBIN | PRIORITY
  decision: text('decision').notNull(), // ALLOCATED | WAITLISTED | REJECTED
  leaseId: text('lease_id'),
  metrics: jsonb('metrics'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Routes ----------
export const routes = pgTable('routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').references(() => bookings.id),
  originNode: uuid('origin_node').references(() => campusNodes.id),
  destinationNode: uuid('destination_node').references(() => campusNodes.id),
  algorithm: text('algorithm').notNull(), // DIJKSTRA | BELLMAN_FORD
  path: jsonb('path').notNull(),
  cost: numeric('cost').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Audit Log ----------
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => profiles.id),
  action: text('action').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  correlationId: text('correlation_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- 3NF Inventory Extension ----------
export const equipmentCategories = pgTable('equipment_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
});

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  gstin: text('gstin').unique(),
  address: text('address'),
});

export const equipmentModels = pgTable('equipment_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => equipmentCategories.id),
  brand: text('brand'),
  modelName: text('model_name').notNull(),
  configKey: text('config_key').notNull().unique(),
});

export const purchaseBatches = pgTable('purchase_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  acquisitionLabId: uuid('acquisition_lab_id').notNull().references(() => labs.id),
  modelId: uuid('model_id').notNull().references(() => equipmentModels.id),
  supplierId: uuid('supplier_id').references(() => suppliers.id),
  registerSrNo: text('register_sr_no').notNull(),
  purchaseDate: date('purchase_date'),
  referenceNo: text('reference_no'),
  quantityOriginal: integer('quantity_original'),
  quantityCurrent: integer('quantity_current'),
  unitRate: numeric('unit_rate', { precision: 14, scale: 2 }),
  totalCost: numeric('total_cost', { precision: 16, scale: 2 }),
  status: text('status'),
  sourceFile: text('source_file').notNull(),
  sourcePage: integer('source_page').notNull(),
  sourceDescription: text('source_description'),
});

export const assetEvents = pgTable('asset_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').notNull().references(() => purchaseBatches.id),
  eventType: text('event_type').notNull(),
  quantityChange: integer('quantity_change').notNull().default(0),
  fromLabId: uuid('from_lab_id').references(() => labs.id),
  toLabId: uuid('to_lab_id').references(() => labs.id),
  eventDate: date('event_date'),
  details: text('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const computerSpecs = pgTable('computer_specs', {
  modelId: uuid('model_id').primaryKey().references(() => equipmentModels.id),
  processor: text('processor'),
  ramGb: integer('ram_gb'),
  storage: text('storage'),
  operatingSystem: text('operating_system'),
  monitorSizeIn: numeric('monitor_size_in', { precision: 5, scale: 2 }),
});

export const laptopSpecs = pgTable('laptop_specs', {
  modelId: uuid('model_id').primaryKey().references(() => equipmentModels.id),
  processor: text('processor'),
  ramGb: integer('ram_gb'),
  storage: text('storage'),
  operatingSystem: text('operating_system'),
  monitorSizeIn: numeric('monitor_size_in', { precision: 5, scale: 2 }),
});

export const printerSpecs = pgTable('printer_specs', {
  modelId: uuid('model_id').primaryKey().references(() => equipmentModels.id),
  functions: text('functions'),
  printSpeedPpm: integer('print_speed_ppm'),
  resolution: text('resolution'),
  connectivity: text('connectivity'),
  inputTraySheets: integer('input_tray_sheets'),
});

export const upsSpecs = pgTable('ups_specs', {
  modelId: uuid('model_id').primaryKey().references(() => equipmentModels.id),
  capacityKva: numeric('capacity_kva', { precision: 8, scale: 2 }),
  dcVoltage: integer('dc_voltage'),
  inputVoltageRange: text('input_voltage_range'),
  outputPowerFactor: numeric('output_power_factor', { precision: 5, scale: 2 }),
  chargerAmp: integer('charger_amp'),
  batterySpec: text('battery_spec'),
});

export const batterySpecs = pgTable('battery_specs', {
  modelId: uuid('model_id').primaryKey().references(() => equipmentModels.id),
  voltageV: integer('voltage_v'),
  capacityAh: integer('capacity_ah'),
  batteryType: text('battery_type'),
});

export const projectorSpecs = pgTable('projector_specs', {
  modelId: uuid('model_id').primaryKey().references(() => equipmentModels.id),
  technology: text('technology'),
  brightnessLumens: integer('brightness_lumens'),
});

export const interactivePanelSpecs = pgTable('interactive_panel_specs', {
  modelId: uuid('model_id').primaryKey().references(() => equipmentModels.id),
  screenSizeIn: numeric('screen_size_in', { precision: 5, scale: 2 }),
  resolution: text('resolution'),
  androidVersion: text('android_version'),
  ramGb: integer('ram_gb'),
  storage: text('storage'),
  touchPoints: integer('touch_points'),
  touchAccuracyMm: numeric('touch_accuracy_mm', { precision: 5, scale: 2 }),
  typeCPowerW: integer('type_c_power_w'),
});

// ---------- Relations ----------
export const profilesRelations = relations(profiles, ({ many }) => ({
  bookings: many(bookings),
  auditLogs: many(auditLog),
}));

export const labsRelations = relations(labs, ({ one, many }) => ({
  campusNode: one(campusNodes, {
    fields: [labs.nodeId],
    references: [campusNodes.id],
  }),
  resources: many(resources),
  bookings: many(bookings),
  purchaseBatches: many(purchaseBatches),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  lab: one(labs, {
    fields: [resources.labId],
    references: [labs.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(profiles, {
    fields: [bookings.userId],
    references: [profiles.id],
  }),
  lab: one(labs, {
    fields: [bookings.labId],
    references: [labs.id],
  }),
  resource: one(resources, {
    fields: [bookings.resourceId],
    references: [resources.id],
  }),
  decisions: many(schedulingDecisions),
  routes: many(routes),
}));
