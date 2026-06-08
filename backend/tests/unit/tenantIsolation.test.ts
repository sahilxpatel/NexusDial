import { assertTenantOwnership } from '../../src/utils/auth';

describe('Tenant Isolation Tests', () => {
  test('throws when tenant IDs mismatch', () => {
    expect(() => assertTenantOwnership({ tenantId: 'abc' }, 'xyz')).toThrow('Tenant mismatch');
  });

  test('passes when tenant IDs match', () => {
    expect(() => assertTenantOwnership({ tenantId: 'abc' }, 'abc')).not.toThrow();
  });
});
