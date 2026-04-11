import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TbUser } from './tb-user.entity';

@Entity({ schema: 'kpi_security', name: 'tb_user_sucursal' })
@Index('idx_tb_user_sucursal_user_id', ['userId'])
@Index('idx_tb_user_sucursal_sucursal_id', ['sucursalId'])
@Index('idx_tb_user_sucursal_is_deleted', ['isDeleted'])
export class TbUserSucursal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => TbUser, (user) => user.userSucursales, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: TbUser;

  @Column({ type: 'uuid', name: 'sucursal_id' })
  sucursalId: string;

  @Column({ type: 'timestamp without time zone', name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @Column({ type: 'timestamp without time zone', name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;

  @Column({ type: 'text', name: 'created_by', nullable: true })
  createdBy: string | null;

  @Column({ type: 'text', name: 'updated_by', nullable: true })
  updatedBy: string | null;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp without time zone', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'text', name: 'deleted_by', nullable: true })
  deletedBy: string | null;
}
