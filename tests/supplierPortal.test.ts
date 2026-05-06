import { describe, expect, it } from 'vitest';
import { isSupplierViewerRole } from '@/lib/supplierPortal';

describe('supplier portal helper', () => {
  it('identifies supplier viewer role only', () => {
    expect(isSupplierViewerRole('supplier_viewer')).toBe(true);
    expect(isSupplierViewerRole('viewer')).toBe(false);
    expect(isSupplierViewerRole(null)).toBe(false);
  });
});
