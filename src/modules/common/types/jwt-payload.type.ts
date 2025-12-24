import { RolUsuarioEnum } from 'src/modules/users/Enums/users-roles.enum';

export type JwtPayload = {
  id: string;
  sub: string;
  jti: string;
  exp: number;
  iat: number;
  role: RolUsuarioEnum;
  alias: string;
  isVerified: boolean;
};
