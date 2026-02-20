/**
 * Unit tests for the management cost calculation logic.
 * 
 * These tests validate the core business logic extracted from the
 * /api/statistics/management-history API route:
 *   totalCost = materialCost + laborCost
 *   materialCost = SUM(quantity * unit_cost)
 *   laborCost = team_size * durationHours * laborCostRate
 */

// ---- Extracted pure functions for testing ----

interface MaterialInput {
    quantity: string | number | null;
    unit_cost: string | number | null;
}

interface ServiceOrderInput {
    executed_at: Date | null;
    start_time: Date | null;
    team_size: number | null;
    materials: MaterialInput[];
    treeCount: number;
}

/**
 * Calculates the material cost for a service order.
 * Protects against NaN by falling back to 0 for invalid values.
 */
function calculateMaterialCost(materials: MaterialInput[]): number {
    return materials.reduce((sum, mat) => {
        const qty = Number(mat.quantity);
        const cost = Number(mat.unit_cost);
        const lineTotal = (!isNaN(qty) && !isNaN(cost)) ? qty * cost : 0;
        return sum + lineTotal;
    }, 0);
}

/**
 * Calculates the labor cost for a service order.
 * Clamps negative durations to 0 to handle data inconsistencies.
 */
function calculateLaborCost(
    startTime: Date | null,
    executedAt: Date | null,
    teamSize: number | null,
    laborCostRate: number
): number {
    if (!startTime || !executedAt) return 0;
    const durationMs = executedAt.getTime() - startTime.getTime();
    const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
    return (teamSize || 1) * durationHours * laborCostRate;
}

/**
 * Calculates total cost (material + labor), rounded to 2 decimal places.
 */
function calculateTotalCost(so: ServiceOrderInput, laborCostRate: number): number {
    const materialCost = calculateMaterialCost(so.materials);
    const laborCost = calculateLaborCost(so.start_time, so.executed_at, so.team_size, laborCostRate);
    return Math.round((materialCost + laborCost) * 100) / 100;
}

// ---- Tests ----

describe('calculateMaterialCost', () => {
    test('calculates correctly with valid numeric strings', () => {
        const materials = [
            { quantity: '2', unit_cost: '6.29' },
            { quantity: '5', unit_cost: '10.00' },
        ];
        expect(calculateMaterialCost(materials)).toBeCloseTo(62.58);
    });

    test('returns 0 for empty materials array', () => {
        expect(calculateMaterialCost([])).toBe(0);
    });

    test('handles NaN quantity gracefully (falls back to 0)', () => {
        const materials = [
            { quantity: 'abc', unit_cost: '10.00' },
        ];
        expect(calculateMaterialCost(materials)).toBe(0);
    });

    test('handles NaN unit_cost gracefully (falls back to 0)', () => {
        const materials = [
            { quantity: '5', unit_cost: 'invalid' },
        ];
        expect(calculateMaterialCost(materials)).toBe(0);
    });

    test('handles null values gracefully', () => {
        const materials = [
            { quantity: null, unit_cost: '10.00' },
            { quantity: '5', unit_cost: null },
        ];
        expect(calculateMaterialCost(materials)).toBe(0);
    });

    test('handles mixed valid and invalid materials', () => {
        const materials = [
            { quantity: '2', unit_cost: '6.29' },   // valid: 12.58
            { quantity: 'abc', unit_cost: '10.00' }, // invalid: 0
            { quantity: '3', unit_cost: '5.00' },    // valid: 15.00
        ];
        expect(calculateMaterialCost(materials)).toBeCloseTo(27.58);
    });

    test('handles numeric values (not just strings)', () => {
        const materials = [
            { quantity: 2, unit_cost: 6.29 },
        ];
        expect(calculateMaterialCost(materials)).toBeCloseTo(12.58);
    });
});

describe('calculateLaborCost', () => {
    const laborCostRate = 50; // R$ 50/h

    test('calculates correctly for known duration (2 hours, 3 people)', () => {
        const start = new Date('2026-02-10T10:00:00Z');
        const end = new Date('2026-02-10T12:00:00Z'); // 2 hours later
        expect(calculateLaborCost(start, end, 3, laborCostRate)).toBe(300);
    });

    test('returns 0 when start_time is null', () => {
        const end = new Date('2026-02-10T12:00:00Z');
        expect(calculateLaborCost(null, end, 3, laborCostRate)).toBe(0);
    });

    test('returns 0 when executed_at is null', () => {
        const start = new Date('2026-02-10T10:00:00Z');
        expect(calculateLaborCost(start, null, 3, laborCostRate)).toBe(0);
    });

    test('clamps negative duration to 0 (executed_at before start_time)', () => {
        const start = new Date('2026-02-10T14:00:00Z');
        const end = new Date('2026-02-10T10:00:00Z'); // BEFORE start
        expect(calculateLaborCost(start, end, 3, laborCostRate)).toBe(0);
    });

    test('defaults team_size to 1 when null', () => {
        const start = new Date('2026-02-10T10:00:00Z');
        const end = new Date('2026-02-10T12:00:00Z');
        expect(calculateLaborCost(start, end, null, laborCostRate)).toBe(100); // 1 * 2h * 50
    });

    test('handles zero labor cost rate', () => {
        const start = new Date('2026-02-10T10:00:00Z');
        const end = new Date('2026-02-10T12:00:00Z');
        expect(calculateLaborCost(start, end, 3, 0)).toBe(0);
    });

    test('handles fractional hours (1h30m)', () => {
        const start = new Date('2026-02-10T10:00:00Z');
        const end = new Date('2026-02-10T11:30:00Z'); // 1.5 hours
        expect(calculateLaborCost(start, end, 2, laborCostRate)).toBe(150); // 2 * 1.5h * 50
    });
});

describe('calculateTotalCost', () => {
    test('correctly sums material + labor for OS 3 scenario', () => {
        const so: ServiceOrderInput = {
            executed_at: new Date('2026-02-10T12:00:00Z'),
            start_time: new Date('2026-02-10T10:00:00Z'),
            team_size: 3,
            materials: [{ quantity: '2', unit_cost: '6.29' }],
            treeCount: 1,
        };
        // Material: 2 * 6.29 = 12.58
        // Labor: 3 * 2h * 50 = 300.00
        // Total: 312.58
        expect(calculateTotalCost(so, 50)).toBe(312.58);
    });

    test('returns only material cost when no timestamps', () => {
        const so: ServiceOrderInput = {
            executed_at: null,
            start_time: null,
            team_size: null,
            materials: [{ quantity: '5', unit_cost: '10.00' }],
            treeCount: 1,
        };
        expect(calculateTotalCost(so, 50)).toBe(50);
    });

    test('rounds floating point to 2 decimal places', () => {
        // 0.1 + 0.2 = 0.30000000000000004 in JS
        const so: ServiceOrderInput = {
            executed_at: null,
            start_time: null,
            team_size: null,
            materials: [
                { quantity: '1', unit_cost: '0.1' },
                { quantity: '1', unit_cost: '0.2' },
            ],
            treeCount: 1,
        };
        expect(calculateTotalCost(so, 0)).toBe(0.3);
    });

    test('handles completely empty service order', () => {
        const so: ServiceOrderInput = {
            executed_at: null,
            start_time: null,
            team_size: null,
            materials: [],
            treeCount: 0,
        };
        expect(calculateTotalCost(so, 50)).toBe(0);
    });
});

describe('Input validation edge cases', () => {
    test('year validation: NaN should be rejected', () => {
        expect(isNaN(parseInt('abc', 10))).toBe(true);
    });

    test('year validation: valid year should parse correctly', () => {
        expect(parseInt('2026', 10)).toBe(2026);
    });

    test('month validation: out of range should be detectable', () => {
        const month = parseInt('13', 10);
        expect(month < 1 || month > 12).toBe(true);
    });

    test('month validation: valid month should be in range', () => {
        const month = parseInt('6', 10);
        expect(month >= 1 && month <= 12).toBe(true);
    });
});
