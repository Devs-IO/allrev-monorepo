import { BusinessException } from './business.exception';

export class ClientNotFoundException extends BusinessException {
  constructor(id: string) {
    super('CLIENT_NOT_FOUND', 'client.not_found', { id });
  }
}
