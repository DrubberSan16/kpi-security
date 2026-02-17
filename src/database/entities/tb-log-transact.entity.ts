import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'kpi_security', name: 'tb_log_transact' })
@Index('idx_tb_log_transact_created_at', ['createdAt'])
@Index('idx_tb_log_transact_is_deleted', ['isDeleted'])
export class TbLogTransact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'character varying', length: 100, name: 'module_microservice' })
  moduleMicroservice: string;

  @Column({ type: 'text', name: 'type_log', nullable: true })
  typeLog: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

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
}
