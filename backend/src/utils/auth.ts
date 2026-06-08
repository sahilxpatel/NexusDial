import { AppError } from '../middleware/errorHandler';

export const assertTenantOwnership = (resource: { tenantId: string }, tenantId: string): void => {
  if (resource.tenantId !== tenantId) {
    const error = new Error('Tenant mismatch') as AppError;
    error.statusCode = 404;
    error.code = 'ND_4043';
    throw error;
  }
};
