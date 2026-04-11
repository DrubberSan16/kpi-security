import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'kpi_inventory', name: 'tb_sucursal' })
export class InventorySucursal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'character varying', length: 30 })
  codigo: string;

  @Column({ type: 'character varying', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  status?: string | null;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted: boolean;
}
