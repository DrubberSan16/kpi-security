import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TbRole } from './tb-role.entity';
import { TbMenu } from './tb-menu.entity';

@Entity({ schema: 'kpi_security', name: 'tb_menu_role' })
@Index('idx_tb_menu_role_created_at', ['createdAt'])
@Index('idx_tb_menu_role_is_deleted', ['isDelete'])
@Index('idx_tb_menu_role_menu_id', ['menuId'])
@Index('idx_tb_menu_role_role_id', ['roleId'])
export class TbMenuRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'role_id' })
  roleId: string;

  @ManyToOne(() => TbRole, (r) => r.menuRoles, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: TbRole;

  @Column({ type: 'uuid', name: 'menu_id' })
  menuId: string;

  @ManyToOne(() => TbMenu, (m) => m.menuRoles, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: TbMenu;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'timestamp without time zone', name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @Column({ type: 'timestamp without time zone', name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;

  @Column({ type: 'text', name: 'created_by', nullable: true })
  createdBy: string | null;

  @Column({ type: 'text', name: 'updated_by', nullable: true })
  updatedBy: string | null;

  // OJO: en esta tabla el flag de borrado se llama is_delete (no is_deleted)
  @Column({ type: 'boolean', name: 'is_delete', default: false })
  isDelete: boolean;

  @Column({ type: 'timestamp without time zone', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'text', name: 'deleted_by', nullable: true })
  deletedBy: string | null;

  @Column({ type: 'boolean', name: 'is_readed', nullable: true })
  isReaded: boolean | null;

  @Column({ type: 'boolean', name: 'is_created', nullable: true })
  isCreated: boolean | null;

  @Column({ type: 'boolean', name: 'is_edited', nullable: true })
  isEdited: boolean | null;

  // OJO: este "is_deleted" aquí es permiso, no soft delete
  @Column({ type: 'boolean', name: 'is_deleted', nullable: true })
  permitDeleted: boolean | null;

  @Column({ type: 'boolean', name: 'is_reports', nullable: true })
  isReports: boolean | null;

  @Column({ type: 'text', name: 'reports_permit', nullable: true })
  reportsPermit: string | null;
}
