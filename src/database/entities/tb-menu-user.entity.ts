import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TbUser } from './tb-user.entity';
import { TbMenu } from './tb-menu.entity';

@Entity({ schema: 'kpi_security', name: 'tb_menu_user' })
@Index('idx_tb_menu_user_created_at', ['createdAt'])
@Index('idx_tb_menu_user_is_deleted', ['isDelete'])
@Index('idx_tb_menu_user_menu_id', ['menuId'])
@Index('idx_tb_menu_user_user_id', ['userId'])
export class TbMenuUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => TbUser, (u) => u.menuUsers, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: TbUser;

  @Column({ type: 'uuid', name: 'menu_id' })
  menuId: string;

  @ManyToOne(() => TbMenu, (m) => m.menuUsers, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
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

  @Column({ type: 'boolean', name: 'is_deleted', nullable: true })
  permitDeleted: boolean | null;

  @Column({ type: 'boolean', name: 'is_reports', nullable: true })
  isReports: boolean | null;

  @Column({ type: 'text', name: 'reports_permit', nullable: true })
  reportsPermit: string | null;
}
