import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TbUser } from './tb-user.entity';
import { TbMenuRole } from './tb-menu-role.entity';

@Entity({ schema: 'kpi_security', name: 'tb_role' })
@Index('idx_tb_role_created_at', ['createdAt'])
@Index('idx_tb_role_is_deleted', ['isDeleted'])
export class TbRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'character varying', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  reportes: string[];

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

  @OneToMany(() => TbUser, (u) => u.role)
  users: TbUser[];

  @OneToMany(() => TbMenuRole, (mr) => mr.role)
  menuRoles: TbMenuRole[];
}
