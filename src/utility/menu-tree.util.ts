type AnyObj = Record<string, any>;

function toPos(v: any): number {
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export function buildMenuTree<T extends AnyObj>(
  nodes: T[],
  getId: (n: T) => string,
  getParentId: (n: T) => string | null | undefined,
  getOrder: (n: T) => number,
) {
  const map = new Map<string, T & { children: any[] }>();
  const roots: Array<T & { children: any[] }> = [];

  // 1) Normalizar nodos + map
  for (const n of nodes) {
    map.set(getId(n), { ...(n as any), children: [] });
  }

  // 2) Enlazar padre -> hijos
  for (const n of map.values()) {
    const parentId = getParentId(n);
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(n);
    } else {
      // si no tiene padre o el padre no viene en el set -> root
      roots.push(n);
    }
  }

  // 3) Orden recursivo (menuPosition)
  const sortRec = (arr: Array<T & { children: any[] }>) => {
    arr.sort((a, b) => getOrder(a) - getOrder(b));
    for (const it of arr) sortRec(it.children);
  };
  sortRec(roots);

  return roots;
}

// Helper para menuPosition (bigint como string)
export const orderByMenuPosition = (n: AnyObj) => toPos(n?.menuPosition);
