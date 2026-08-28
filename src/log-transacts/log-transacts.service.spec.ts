import { LogTransactsService } from './log-transacts.service';
import { REDACTED_VALUE } from '../common/utils/request-payload.util';

describe('LogTransactsService', () => {
  const createRepo = () =>
    ({
      metadata: { columns: [] },
      create: jest.fn((entity: any) => entity),
      save: jest.fn(async (entity: any) => ({ id: 'log-1', ...entity })),
      query: jest.fn().mockResolvedValue(undefined),
    }) as any;

  it('guarda el contexto de la solicitud junto al error', async () => {
    const repo = createRepo();
    const service = new LogTransactsService(repo);

    const saved: any = await service.create({
      moduleMicroservice: 'kpi_maintenance',
      status: 'ERROR',
      typeLog: 'EQUIPO_CREATE',
      description: 'No se pudo guardar el equipo',
      createdBy: 'jenny.ramirez',
      requestMethod: 'post',
      requestUrl: '/kpi_maintenance/equipos',
      requestPayload: { codigo: 'EQ-A00024', passUser: 'secreta' },
    });

    expect(saved.requestMethod).toBe('POST');
    expect(saved.requestUrl).toBe('/kpi_maintenance/equipos');
    expect(saved.requestPayload).toEqual({
      codigo: 'EQ-A00024',
      passUser: REDACTED_VALUE,
    });
  });

  it('deja el contexto en null cuando el emisor no lo envia', async () => {
    const repo = createRepo();
    const service = new LogTransactsService(repo);

    const saved: any = await service.create({
      moduleMicroservice: 'kpi_inventory',
      status: 'SUCCESS',
      description: 'Transferencia registrada',
    });

    expect(saved.requestMethod).toBeNull();
    expect(saved.requestUrl).toBeNull();
    expect(saved.requestPayload).toBeNull();
  });

  it('asegura las columnas del contexto al arrancar', async () => {
    const repo = createRepo();
    const service = new LogTransactsService(repo);

    await service.onModuleInit();

    const sql = String(repo.query.mock.calls[0][0]);
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS request_method');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS request_url');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS request_payload');
  });
});
