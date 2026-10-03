import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

export function mockApiPlugin(): Plugin {
  const handler = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
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
            { name: 'public.profiles', description: 'Institutional Auth & RBAC Profile Store', documents: 6 },
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

    // 5. Inventory Batches
    if (url.startsWith('/api/v1/inventory/batches')) {
      const batchesData = [
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
          operating_system: 'Ubuntu Linux 22.04 LTS / Win',
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
      ];
      return sendJson(200, { success: true, count: batchesData.length, data: batchesData });
    }

    // 6. Inventory Models
    if (url.startsWith('/api/v1/inventory/models')) {
      const modelsData = [
        { model_id: 'MOD001', category_id: 'CAT-PC', category_name: 'Desktop Workstations', brand: 'Dell', model_name: 'OptiPlex 3010', configuration_summary: 'Core i5-3470 | 4GB RAM | 500GB HDD', attributes: { processor: 'i5-3470', ram: 4 } },
        { model_id: 'MOD002', category_id: 'CAT-PC', category_name: 'Desktop Workstations', brand: 'Dell', model_name: 'OptiPlex 5090 SFF', configuration_summary: 'Core i7-11700 | 8GB RAM | 1TB HDD', attributes: { processor: 'i7-11700', ram: 8 } },
        { model_id: 'MOD004', category_id: 'CAT-WS', category_name: 'High-Performance Workstations', brand: 'HP', model_name: 'Z4 G4 Workstation', configuration_summary: 'Intel Xeon W-2245 | 32GB RAM | RTX A4000 GPU', attributes: { processor: 'Xeon W-2245', ram: 32 } },
      ];
      return sendJson(200, { success: true, count: modelsData.length, data: modelsData });
    }

    // 7. Inventory Labs Summary
    if (url.startsWith('/api/v1/inventory/labs')) {
      const labsData = [
        { lab_code: 'D-01', lab_name: 'Linux Laboratory', total_batches: 6, total_current_qty: 42, total_original_qty: 42, total_investment: 2420000, total_investment_formatted: '₹24,20,000.00', brands: ['Dell', 'Samsung'], models: ['OptiPlex 3010', 'OptiPlex 5090 SFF'] },
        { lab_code: 'D-02', lab_name: 'Database Laboratory', total_batches: 5, total_current_qty: 46, total_original_qty: 48, total_investment: 2150000, total_investment_formatted: '₹21,50,000.00', brands: ['Dell', 'HP'], models: ['OptiPlex 360', 'OptiPlex 3040'] },
        { lab_code: 'D-03', lab_name: 'AI & Machine Learning Lab', total_batches: 7, total_current_qty: 49, total_original_qty: 50, total_investment: 3890000, total_investment_formatted: '₹38,90,000.00', brands: ['HP', 'Apple'], models: ['Z4 G4 Workstation', 'Mac Studio M2'] },
      ];
      return sendJson(200, { success: true, count: labsData.length, data: labsData });
    }

    // 8. Inventory Summary Stats
    if (url.startsWith('/api/v1/inventory/summary')) {
      return sendJson(200, {
        success: true,
        data: {
          total_batches: 32,
          total_current_quantity: 486,
          total_original_quantity: 512,
          total_investment: 14850000,
          total_investment_formatted: '₹1,48,50,000.00',
          total_models: 7,
          total_categories: 5,
          total_labs: 7,
          top_supplier: 'Veetrag Computers Private Ltd.',
          status_breakdown: { OPERATIONAL: 14, IN_USE: 3, MAINTENANCE: 1, OFFLINE: 1 },
          os_breakdown: { Ubuntu: 18, 'Windows 10/11': 14 },
          brand_breakdown: { Dell: 28, HP: 14, Lenovo: 6 },
        },
      });
    }

    // 9. Inventory Equipment PUT / update status
    if (url.startsWith('/api/v1/inventory/equipment/') && req.method === 'PUT') {
      const parts = url.split('/');
      const itemId = parts[parts.length - 1];
      return sendJson(200, {
        success: true,
        message: 'Status updated successfully',
        data: { id: itemId, status: 'OPERATIONAL' },
      });
    }

    // 10. Main Inventory Dashboard Endpoint (/api/v1/inventory)
    if (url.startsWith('/api/v1/inventory')) {
      const mockEquipment = [
        {
          id: 'EQ-D01-01',
          batch_id: 'BAT0005',
          asset_tag: 'RIT-CSE-D01-WS01',
          serial_number: 'DEL-3010-0981',
          equipment_name: 'Dell OptiPlex 3010 (WS-01)',
          category: 'Workstation / PC',
          brand: 'Dell',
          model: 'OptiPlex 3010',
          lab_code: 'D-01',
          lab_name: 'Linux Laboratory',
          processor: 'Intel Core i5-3470 (3.20 GHz)',
          ram: '4 GB DDR3',
          storage: '500 GB SATA',
          os: 'Ubuntu Linux 22.04 LTS',
          status: 'OPERATIONAL',
          health_score: 96,
          purchase_date: '2013-09-23',
          unit_cost: 33600,
          unit_cost_formatted: '₹33,600.00',
          supplier_name: 'Veetrag Computers Private Ltd.',
          last_maintenance: '2026-09-15',
          next_maintenance: '2026-12-15',
        },
        {
          id: 'EQ-D01-02',
          batch_id: 'BAT0005',
          asset_tag: 'RIT-CSE-D01-WS02',
          serial_number: 'DEL-3010-0982',
          equipment_name: 'Dell OptiPlex 3010 (WS-02)',
          category: 'Workstation / PC',
          brand: 'Dell',
          model: 'OptiPlex 3010',
          lab_code: 'D-01',
          lab_name: 'Linux Laboratory',
          processor: 'Intel Core i5-3470 (3.20 GHz)',
          ram: '4 GB DDR3',
          storage: '500 GB SATA',
          os: 'Ubuntu Linux 22.04 LTS',
          status: 'IN_USE',
          health_score: 92,
          purchase_date: '2013-09-23',
          unit_cost: 33600,
          unit_cost_formatted: '₹33,600.00',
          supplier_name: 'Veetrag Computers Private Ltd.',
          last_maintenance: '2026-09-15',
          next_maintenance: '2026-12-15',
          assigned_to: 'Student 2553018',
        },
        {
          id: 'EQ-D01-03',
          batch_id: 'BAT0006',
          asset_tag: 'RIT-CSE-D01-WS03',
          serial_number: 'DEL-5090-1102',
          equipment_name: 'Dell OptiPlex 5090 SFF (WS-03)',
          category: 'Workstation / PC',
          brand: 'Dell',
          model: 'OptiPlex 5090 SFF',
          lab_code: 'D-01',
          lab_name: 'Linux Laboratory',
          processor: 'Intel Core i7-11700 (8-Core)',
          ram: '8 GB DDR4',
          storage: '1 TB SATA HDD',
          os: 'Ubuntu Linux 24.04',
          status: 'OPERATIONAL',
          health_score: 98,
          purchase_date: '2022-03-26',
          unit_cost: 86933,
          unit_cost_formatted: '₹86,933.00',
          supplier_name: 'Veetrag Computers Private Ltd.',
          last_maintenance: '2026-09-10',
          next_maintenance: '2026-12-10',
        },
        {
          id: 'EQ-D01-DISP',
          batch_id: 'BAT0041',
          asset_tag: 'RIT-CSE-D01-DISP01',
          serial_number: 'SAM-FLIP-65-8891',
          equipment_name: 'Samsung Flip 65" 2.0 Smart Board',
          category: 'Interactive Display',
          brand: 'Samsung',
          model: 'Flip 65 2.0 (LH65WMRWBGCXXL)',
          lab_code: 'D-01',
          lab_name: 'Linux Laboratory',
          processor: 'Tizen Touch Processor',
          ram: '8 GB',
          storage: '32 GB eMMC',
          os: 'Samsung Tizen OS',
          status: 'OPERATIONAL',
          health_score: 99,
          purchase_date: '2021-08-18',
          unit_cost: 145000,
          unit_cost_formatted: '₹1,45,000.00',
          supplier_name: 'Samrat Electronics Sangli',
          last_maintenance: '2026-08-20',
          next_maintenance: '2026-11-20',
        },
        {
          id: 'EQ-D02-01',
          batch_id: 'BAT0007',
          asset_tag: 'RIT-CSE-D02-WS01',
          serial_number: 'DEL-360-4491',
          equipment_name: 'Dell OptiPlex 360 (WS-01)',
          category: 'Workstation / PC',
          brand: 'Dell',
          model: 'OptiPlex 360',
          lab_code: 'D-02',
          lab_name: 'Database Laboratory',
          processor: 'Intel Core 2 Duo E7500 (2.93 GHz)',
          ram: '2 GB DDR2',
          storage: '250 GB SATA',
          os: 'Debian 11 PostgreSQL Host',
          status: 'OPERATIONAL',
          health_score: 84,
          purchase_date: '2009-09-15',
          unit_cost: 26500,
          unit_cost_formatted: '₹26,500.00',
          supplier_name: 'Microline Computer Systems',
          last_maintenance: '2026-09-01',
          next_maintenance: '2026-12-01',
        },
        {
          id: 'EQ-D02-02',
          batch_id: 'BAT0008',
          asset_tag: 'RIT-CSE-D02-WS02',
          serial_number: 'DEL-3040-5512',
          equipment_name: 'Dell OptiPlex 3040 MT (WS-02)',
          category: 'Workstation / PC',
          brand: 'Dell',
          model: 'OptiPlex 3040',
          lab_code: 'D-02',
          lab_name: 'Database Laboratory',
          processor: 'Intel Core i5-6500',
          ram: '8 GB DDR4',
          storage: '500 GB SATA',
          os: 'Windows 10 / Oracle Database',
          status: 'IN_USE',
          health_score: 91,
          purchase_date: '2016-10-14',
          unit_cost: 42000,
          unit_cost_formatted: '₹42,000.00',
          supplier_name: 'Veetrag Computers Private Ltd.',
          last_maintenance: '2026-08-15',
          next_maintenance: '2026-11-15',
          assigned_to: 'Student 2553019',
        },
        {
          id: 'EQ-D03-01',
          batch_id: 'BAT0010',
          asset_tag: 'RIT-CSE-D03-AI01',
          serial_number: 'HP-Z4-9921',
          equipment_name: 'HP Z4 G4 Deep Learning Node (WS-01)',
          category: 'High-Performance Workstations',
          brand: 'HP',
          model: 'Z4 G4 Workstation',
          lab_code: 'D-03',
          lab_name: 'AI & Machine Learning Lab',
          processor: 'Intel Xeon W-2245 (8-Core / 16-Thread)',
          ram: '32 GB ECC DDR4',
          storage: '1 TB NVMe SSD + 2TB HDD',
          os: 'Ubuntu 22.04 LTS (CUDA 12.2 / PyTorch)',
          status: 'OPERATIONAL',
          health_score: 99,
          purchase_date: '2022-11-10',
          unit_cost: 185000,
          unit_cost_formatted: '₹1,85,000.00',
          supplier_name: 'Frontline Systems Pune',
          last_maintenance: '2026-09-20',
          next_maintenance: '2026-12-20',
        },
        {
          id: 'EQ-D03-03',
          batch_id: 'BAT0010',
          asset_tag: 'RIT-CSE-D03-AI03',
          serial_number: 'HP-Z4-9923',
          equipment_name: 'HP Z4 G4 Deep Learning Node (WS-03)',
          category: 'High-Performance Workstations',
          brand: 'HP',
          model: 'Z4 G4 Workstation',
          lab_code: 'D-03',
          lab_name: 'AI & Machine Learning Lab',
          processor: 'Intel Xeon W-2245',
          ram: '32 GB ECC DDR4',
          storage: '1 TB NVMe SSD',
          os: 'Ubuntu 22.04 LTS',
          status: 'MAINTENANCE',
          health_score: 68,
          purchase_date: '2022-11-10',
          unit_cost: 185000,
          unit_cost_formatted: '₹1,85,000.00',
          supplier_name: 'Frontline Systems Pune',
          last_maintenance: '2026-09-28',
          next_maintenance: '2026-10-10',
        },
      ];

      const opCount = mockEquipment.filter((e) => e.status === 'OPERATIONAL').length;
      const inUseCount = mockEquipment.filter((e) => e.status === 'IN_USE').length;
      const maintCount = mockEquipment.filter((e) => e.status === 'MAINTENANCE').length;
      const offCount = mockEquipment.filter((e) => e.status === 'OFFLINE').length;

      return sendJson(200, {
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          total_equipment: mockEquipment.length,
          operational_count: opCount,
          in_use_count: inUseCount,
          maintenance_count: maintCount,
          offline_count: offCount,
          total_batches: 32,
          total_models: 7,
          total_labs: 7,
          total_investment_formatted: '₹1,48,50,000.00',
          total_investment: 14850000,
          status_breakdown: {
            OPERATIONAL: opCount,
            IN_USE: inUseCount,
            MAINTENANCE: maintCount,
            OFFLINE: offCount,
          },
          category_breakdown: {
            'Workstation / PC': 5,
            'High-Performance Workstations': 2,
            'Interactive Display': 1,
          },
          lab_breakdown: {
            'D-01': 4,
            'D-02': 2,
            'D-03': 2,
          },
        },
        equipment: mockEquipment,
        labs: [
          { lab_code: 'D-01', lab_name: 'Linux Laboratory', total_batches: 6, total_current_qty: 42, total_original_qty: 42, total_investment: 2420000, total_investment_formatted: '₹24,20,000.00', brands: ['Dell', 'Samsung'], models: ['OptiPlex 3010', 'OptiPlex 5090 SFF'] },
          { lab_code: 'D-02', lab_name: 'Database Laboratory', total_batches: 5, total_current_qty: 46, total_original_qty: 48, total_investment: 2150000, total_investment_formatted: '₹21,50,000.00', brands: ['Dell', 'HP'], models: ['OptiPlex 360', 'OptiPlex 3040'] },
          { lab_code: 'D-03', lab_name: 'AI & Machine Learning Lab', total_batches: 7, total_current_qty: 49, total_original_qty: 50, total_investment: 3890000, total_investment_formatted: '₹38,90,000.00', brands: ['HP', 'Apple'], models: ['Z4 G4 Workstation', 'Mac Studio M2'] },
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
            operating_system: 'Ubuntu Linux 22.04 LTS / Win',
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
  };

  return {
    name: 'mock-api-server',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
export default mockApiPlugin;
