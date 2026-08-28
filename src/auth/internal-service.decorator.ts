import { SetMetadata } from '@nestjs/common';

export const ALLOW_INTERNAL_SERVICE_KEY = 'allowInternalService';
export const AllowInternalService = () =>
  SetMetadata(ALLOW_INTERNAL_SERVICE_KEY, true);
