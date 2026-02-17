import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TbRole } from './tb-role.entity';
import { TbMenuUser } from './tb-menu-user.entity';

@Entity({ schema: 'kpi_security', name: 'tb_user' })
@Index('idx_tb_user_created_at', ['createdAt'])
@Index('idx_tb_user_is_deleted', ['isDeleted'])
@Index('idx_tb_user_role_id', ['roleId'])
export class TbUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'name_user' })
  nameUser: string;
  
  @Column({ type: 'text', name: 'pass_user', select: false })
  passUser: string;

  @Column({ type: 'text', name: 'token_active', nullable: true })
  tokenActive: string | null;

  @Column({ type: 'text', name: 'name_surname' })
  nameSurname: string;

  @Column({ type: 'date', name: 'date_birthday', nullable: true })
  dateBirthday: string | null;

  @Column({ type: 'uuid', name: 'role_id' })
  roleId: string;

  @ManyToOne(() => TbRole, (r) => r.users, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: TbRole;

  @Column({ type: 'text' })
  email: string;

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

  @OneToMany(() => TbMenuUser, (mu) => mu.user)
  menuUsers: TbMenuUser[];
}
