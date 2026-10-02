import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

export function mockApiPlugin(): Plugin {
  return {
    name: 'mock-api-server',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';

        if (!url.startsWith('/api')) {
          return next();
        }

        // Helper to send JSON response
        const sendJson = (status: number, data: any) => {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = status;
          res.end(JSON.stringify(data));
        };

        // 1. Health endpoint
        if (url === '/api/v1/health' || url === '/api/health') {
          return sendJson(200, {
            success: true,
            message: 'Smart Campus Lab & Resource Optimizer API is healthy',
            data: {
              status: 'ok',
              timestamp: new Date().toISOString(),
              environment: 'development',
              version: '1.0.0',
            },
          });
        }

        // 2. Database Status (Supabase PostgreSQL)
        if (
          url === '/api/v1/database/status' ||
          url === '/api/v1/mongodb/status' ||
          url.startsWith('/api/v1/database') ||
          url.startsWith('/api/v1/mongodb')
        ) {
          return sendJson(200, {
            success: true,
            message: 'Supabase / PostgreSQL relational database status',
            data: {
              status: 'connected',
              connectionState: 'PostgreSQL 15 (Supabase Cloud Architecture)',
              isReady: true,
              database: 'smart-campus (Supabase)',
              engine: 'PostgreSQL 15 (Supabase Cloud)',
              activeTables: [
                { name: 'public.profiles', description: 'Institutional Auth & RBAC Profile Store', documents: 3 },
                { name: 'public.labs', description: 'Normalized Laboratory Hardware Fleet & Facilities', documents: 7 },
                { name: 'public.resources', description: 'Individual Workstations & Hardware Units (WS-D01-01...) with State Machine', documents: 28 },
                { name: 'public.bookings', description: 'Authoritative Reservation Record with ACID commit_booking RPC', documents: 18 },
                { name: 'public.scheduling_decisions', description: 'Scheduling Decisions with Policy (FCFS/SJF/RR/Priority)', documents: 14 },
                { name: 'public.routes', description: 'Campus Graph Routing Paths (Dijkstra/Bellman-Ford)', documents: 9 },
                { name: 'public.purchase_batches', description: '3NF Procurement & Dead-Stock Inventory Register', documents: 32 },
              ],
              configuration: {
                engine: 'PostgreSQL 15',
                host: 'ksecnwtqykmqfidspuzt.supabase.co',
                poolMax: 10,
                schema: 'public',
                supportsRealtimePolling: true,
              },
              models: ['Profile', 'Lab', 'Resource', 'Booking', 'SchedulingDecision', 'Route', 'PurchaseBatch'],
              timestamp: new Date().toISOString(),
            },
          });
        }

        // 3. DFD Constraint Verification
        if (url === '/api/v1/dfd/verify') {
          return sendJson(200, {
            success: true,
            message: 'DFD Architectural Constraint Verification Complete',
            data: {
              reportId: `DFD-REPORT-${Date.now()}`,
              timestamp: new Date().toISOString(),
              allPassed: true,
              passingCount: 10,
              totalRules: 10,
              complianceScorePct: 100,
              executionDurationMs: 18.4,
              rules: [
                { id: 'DFD-C1', flowNumber: 1, name: 'Client Authentication & Idempotency Key', passed: true, details: 'Verified idempotency replay protection across all booking submissions.', latencyMs: 2.1 },
                { id: 'DFD-C2', flowNumber: 2, name: 'Workstation State Machine Lifecycle', passed: true, details: 'Strict transition enforcement: AVAILABLE -> RESERVED -> LEASED -> RELEASED verified.', latencyMs: 1.8 },
                { id: 'DFD-C3', flowNumber: 3, name: 'Multi-Policy Scheduling (FCFS / SJF / RR / Priority)', passed: true, details: 'All 4 scheduling algorithm dispatchers deterministic and conflict-free.', latencyMs: 2.4 },
                { id: 'DFD-C4', flowNumber: 4, name: 'Resource State Locking & Deadlock Prevention', passed: true, details: 'Two-phase reservation locks eliminate concurrency races and double-bookings.', latencyMs: 1.5 },
                { id: 'DFD-C5', flowNumber: 5, name: 'Campus Spatial Graph & Routing Engine', passed: true, details: 'Dijkstra and Bellman-Ford shortest paths between campus zones computed.', latencyMs: 2.2 },
                { id: 'DFD-C6', flowNumber: 6, name: 'Atomic Commit Transaction (commit_booking RPC)', passed: true, details: 'Transactional isolation verified in Supabase PostgreSQL store.', latencyMs: 1.9 },
                { id: 'DFD-C7', flowNumber: 7, name: 'Saga Compensation Rollback (compensate_booking)', passed: true, details: 'Automatic rollback to original states upon simulated node failure.', latencyMs: 2.0 },
                { id: 'DFD-C8', flowNumber: 8, name: '3NF Dead-stock & Procurement Hierarchy', passed: true, details: 'Full normalization: Batches -> Models -> Categories -> Assets consistent.', latencyMs: 1.4 },
                { id: 'DFD-C9', flowNumber: 9, name: 'Role-Based Access Control Scoping', passed: true, details: 'RBAC boundary enforced for Student, Faculty, HOD, and Admin roles.', latencyMs: 1.3 },
                { id: 'DFD-C10', flowNumber: 10, name: 'Immutable Audit Log Correlation', passed: true, details: 'Cryptographically ordered audit trail with microsecond correlation IDs.', latencyMs: 1.8 },
              ],
            },
          });
        }

        // 4. DFD Booking Pipeline Execution
        if (url === '/api/v1/dfd/booking-pipeline' && req.method === 'POST') {
          return sendJson(200, {
            success: true,
            message: 'DFD transactional booking pipeline executed successfully',
            data: {
              bookingId: `BK-${Date.now()}`,
              status: 'CONFIRMED',
              executedSteps: [
                '1. Authenticated client credentials & verified idempotency key',
                '2. Evaluated multi-policy scheduling queue (FCFS policy)',
                '3. Computed optimal campus spatial route via Dijkstra engine',
                '4. Committed atomic commit_booking transaction in Supabase store',
              ],
              timestamp: new Date().toISOString(),
            },
          });
        }

        // 5. Inventory Dashboard & Dead-Stock Data
        if (url.startsWith('/api/v1/inventory')) {
          return sendJson(200, {
            success: true,
            summary: {
              total_batches: 32,
              total_current_quantity: 486,
              total_original_quantity: 512,
              total_investment: 14850000,
              total_investment_formatted: '₹1,48,50,000.00',
              total_operational: 452,
              total_maintenance: 22,
              total_offline: 12,
              overall_health_score: 93.4,
            },
            labs: [
              { lab_code: 'D-01', lab_name: 'Linux Laboratory', total_batches: 6, total_current_qty: 62, total_original_qty: 64, total_investment: 2420000, total_investment_formatted: '₹24,20,000.00', brands: ['Dell', 'HP'], models: ['OptiPlex 3010', 'OptiPlex 5090 SFF'] },
              { lab_code: 'D-02', lab_name: 'Database Laboratory', total_batches: 5, total_current_qty: 70, total_original_qty: 72, total_investment: 2150000, total_investment_formatted: '₹21,50,000.00', brands: ['Dell', 'Lenovo'], models: ['OptiPlex 7070', 'ThinkCentre M720'] },
              { lab_code: 'D-03', lab_name: 'AI & Machine Learning Lab', total_batches: 7, total_current_qty: 84, total_original_qty: 88, total_investment: 3890000, total_investment_formatted: '₹38,90,000.00', brands: ['HP', 'Apple'], models: ['Z4 G4 Workstation', 'Mac Studio M2'] },
              { lab_code: 'D-04', lab_name: 'Network Security Lab', total_batches: 4, total_current_qty: 54, total_original_qty: 56, total_investment: 1740000, total_investment_formatted: '₹17,40,000.00', brands: ['Dell'], models: ['OptiPlex 3080'] },
              { lab_code: 'D-05', lab_name: 'IoT & Embedded Systems Lab', total_batches: 4, total_current_qty: 68, total_original_qty: 70, total_investment: 1980000, total_investment_formatted: '₹19,80,000.00', brands: ['Lenovo'], models: ['ThinkCentre Neo 50s'] },
              { lab_code: 'D-06', lab_name: 'Cloud Computing Lab', total_batches: 3, total_current_qty: 76, total_original_qty: 80, total_investment: 2120000, total_investment_formatted: '₹21,20,000.00', brands: ['Dell'], models: ['PowerEdge R640', 'OptiPlex 7080'] },
              { lab_code: 'D-07', lab_name: 'Advanced Programming Lab', total_batches: 3, total_current_qty: 72, total_original_qty: 82, total_investment: 1550000, total_investment_formatted: '₹15,50,000.00', brands: ['HP'], models: ['ProDesk 400 G7'] },
            ],
            batches: [
              {
                batch_id: 'BAT0005',
                lab_code: 'D-01',
                lab_name: 'Linux Laboratory',
                dead_stock_sr_no: '032',
                brand: 'Dell',
                model_name: 'OptiPlex 3010',
                purchase_date: '23-Sep-2013',
                quantity_current: 20,
                quantity_original: 20,
                unit_rate: 33600.0,
                unit_rate_formatted: '₹33,600.00',
                total_cost: 672000.0,
                total_cost_formatted: '₹6,72,000.00',
                supplier_name: 'Veetrag Computers Private Ltd.',
                warranty_years: null,
                status: 'ACTIVE/RECORDED',
                processor: 'Intel Core i5 3470 Processor',
                ram_gb: 4,
                storage: '500 GB SATA',
                operating_system: 'Windows License Dell',
                monitor_size_in: 18.5,
                serial_numbers_raw: '',
                serial_numbers_list: ['DEL-0005-101', 'DEL-0005-102', 'DEL-0005-103'],
                raw_description: 'DELL Optiplex 3010 Core i5 3470 Processor, 4 GB DDR3 RAM, 500GB SATA',
              },
              {
                batch_id: 'BAT0006',
                lab_code: 'D-01',
                lab_name: 'Linux Laboratory',
                dead_stock_sr_no: '042',
                brand: 'Dell',
                model_name: 'OptiPlex 5090 SFF',
                purchase_date: '26-Mar-2022',
                quantity_current: 2,
                quantity_original: 2,
                unit_rate: 86933.0,
                unit_rate_formatted: '₹86,933.00',
                total_cost: 173866.0,
                total_cost_formatted: '₹1,73,866.00',
                supplier_name: 'Veetrag Computers Private Ltd.',
                warranty_years: 3,
                status: 'ACTIVE/RECORDED',
                processor: 'Intel Core i7-11700',
                ram_gb: 8,
                storage: '1 TB SATA',
                operating_system: 'Windows 10',
                monitor_size_in: 19.0,
                serial_numbers_raw: '',
                serial_numbers_list: ['DEL-0006-101', 'DEL-0006-102'],
                raw_description: 'Dell Optiplex 5090 SFF, Ci7/8GB/1TB/ 18.5" WIN10 Prof 3 Yrs',
              },
            ],
            models: [
              { model_id: 'MOD001', category_id: 'CAT-PC', category_name: 'Desktop Workstations', brand: 'Dell', model_name: 'OptiPlex 3010', configuration_summary: 'Core i5-3470 | 4GB RAM | 500GB HDD', attributes: { processor: 'i5-3470', ram: 4 } },
              { model_id: 'MOD002', category_id: 'CAT-PC', category_name: 'Desktop Workstations', brand: 'Dell', model_name: 'OptiPlex 5090 SFF', configuration_summary: 'Core i7-11700 | 8GB RAM | 1TB HDD', attributes: { processor: 'i7-11700', ram: 8 } },
            ],
          });
        }

        // Fallback for any other API route
        return sendJson(200, {
          success: true,
          message: 'Smart Campus API Handler',
          endpoint: url,
          timestamp: new Date().toISOString(),
        });
      });
    },
  };
}
export default mockApiPlugin;
