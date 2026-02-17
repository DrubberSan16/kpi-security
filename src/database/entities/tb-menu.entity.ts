import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TbMenuRole } from './tb-menu-role.entity';
import { TbMenuUser } from './tb-menu-user.entity';

@Entity({ schema: 'kpi_security', name: 'tb_menu' })
@Index('idx_tb_menu_created_at', ['createdAt'])
@Index('idx_tb_menu_is_deleted', ['isDeleted'])
export class TbMenu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'character varying', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  // En dump NO hay FK, pero es un parent id opcional
  @Column({ type: 'uuid', name: 'menu_id', nullable: true })
  menuId: string | null;

  @Column({ type: 'text', name: 'url_component', nullable: true })
  urlComponent: string | null;

  @Column({ type: 'bigint', name: 'menu_position' })
  menuPosition: string; // bigint -> string para evitar overflow en JS

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

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp without time zone', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'text', name: 'deleted_by', nullable: true })
  deletedBy: string | null;

  @Column({ type: 'text', nullable: true })
  icon: string | null;

  @OneToMany(() => TbMenuRole, (mr) => mr.menu)
  menuRoles: TbMenuRole[];

  @OneToMany(() => TbMenuUser, (mu) => mu.menu)
  menuUsers: TbMenuUser[];
}
