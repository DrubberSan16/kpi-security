import {
  REDACTED_VALUE,
  normalizeRequestMethod,
  normalizeRequestUrl,
  sanitizeRequestPayload,
} from './request-payload.util';

describe('sanitizeRequestPayload', () => {
  it('conserva los datos enviados y enmascara las claves sensibles', () => {
    expect(
      sanitizeRequestPayload({
        nameUser: 'jenny.ramirez',
        passUser: 'super-secreta',
        role: { id: 'rol-1', apiKey: 'abc' },
      }),
    ).toEqual({
      nameUser: 'jenny.ramirez',
      passUser: REDACTED_VALUE,
      role: { id: 'rol-1', apiKey: REDACTED_VALUE },
    });
  });

  it('interpreta el cuerpo serializado que envia axios', () => {
    expect(
      sanitizeRequestPayload('{"codigo":"EQ-A00024","estado_operativo":"CORRECTIVO"}'),
    ).toEqual({ codigo: 'EQ-A00024', estado_operativo: 'CORRECTIVO' });
  });

  it('envuelve el texto que no es JSON', () => {
    expect(sanitizeRequestPayload('codigo=EQ-A00024')).toEqual({
      raw: 'codigo=EQ-A00024',
    });
  });

  it('envuelve una lista para que la columna siempre guarde un objeto', () => {
    expect(sanitizeRequestPayload([{ codigo: 'EQ-1' }, { codigo: 'EQ-2' }])).toEqual({
      items: [{ codigo: 'EQ-1' }, { codigo: 'EQ-2' }],
    });
  });

  it('devuelve null cuando no hay datos', () => {
    expect(sanitizeRequestPayload(undefined)).toBeNull();
    expect(sanitizeRequestPayload(null)).toBeNull();
    expect(sanitizeRequestPayload('   ')).toBeNull();
  });

  it('acota los payloads demasiado grandes', () => {
    const formulario: Record<string, string> = {};
    for (let index = 0; index < 200; index += 1) {
      formulario[`campo_${index}`] = 'x'.repeat(80);
    }

    const result: any = sanitizeRequestPayload(formulario);
    expect(result._truncated).toBe(true);
    expect(String(result._preview).length).toBeLessThanOrEqual(8000);
  });
});

describe('normalizeRequestMethod / normalizeRequestUrl', () => {
  it('normaliza el metodo y descarta valores vacios', () => {
    expect(normalizeRequestMethod('post')).toBe('POST');
    expect(normalizeRequestMethod('  ')).toBeNull();
    expect(normalizeRequestUrl('/kpi_maintenance/equipos')).toBe(
      '/kpi_maintenance/equipos',
    );
    expect(normalizeRequestUrl(undefined)).toBeNull();
  });
});
