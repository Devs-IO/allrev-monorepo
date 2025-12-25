import { BusinessException } from './business.exception';

export class FunctionalityNotFoundException extends BusinessException {
  constructor(id: string) {
    super('FUNCTIONALITY_NOT_FOUND', 'functionality.not_found', { id });
  }
}
