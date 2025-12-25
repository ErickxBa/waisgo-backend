import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { RolUsuarioEnum } from '../../users/Enums/users-roles.enum';
import { EstadoVerificacionEnum } from '../../users/Enums/estado-ver.enum';
import { UserProfile } from './user-profile.entity';

@Entity({ schema: 'business', name: 'business_users' })
@Index('IDX_business_users_rol', ['rol'])
@Index('IDX_business_users_estado_verificacion', ['estadoVerificacion'])
@Index('IDX_business_users_is_deleted', ['isDeleted'])
@Index('IDX_business_users_created_at', ['createdAt'])
export class BusinessUser {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 25, unique: true })
  alias: string;

  @Column({
    type: 'enum',
    enum: RolUsuarioEnum,
    default: RolUsuarioEnum.USER,
  })
  rol: RolUsuarioEnum;

  @Column({
    type: 'enum',
    enum: EstadoVerificacionEnum,
    default: EstadoVerificacionEnum.NO_VERIFICADO,
  })
  estadoVerificacion: EstadoVerificacionEnum;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @OneToOne(() => UserProfile, (p) => p.user, { cascade: true })
  profile: UserProfile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
