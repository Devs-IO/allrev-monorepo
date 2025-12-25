import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/roles.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => {
  // loga os roles recebidos quando o decorator é utilizado
  //console.log(`@Roles decorator called with roles:`, roles);

  const baseDecorator = SetMetadata(ROLES_KEY, roles);
  return (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    //const methodName = key?.toString() ?? '<class-level>';
    // console.log(
    //   `→ Setting metadata '${ROLES_KEY}' on ${target.constructor?.name}.${methodName}:`,
    //   roles,
    // );
    return (baseDecorator as any)(target as any, key as any, descriptor as any);
  };
};
