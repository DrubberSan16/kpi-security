type AnyObj = Record<string, any>;

function toPos(v: any): number {
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}
function toNum(v: any): number {
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export function buildMenuTree(nodes: any[]) {
  const byId = new Map<string, any>();
  const roots: any[] = [];

  // Normaliza y crea mapa
  for (const n of nodes) {
    byId.set(n.id, { ...n, children: [] });
  }

  // Link padre -> hijos
  for (const n of byId.values()) {
    const parentId = n.parentId;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).children.push(n);
    } else {
      roots.push(n);
    }
  }

  // Orden recursivo por menuPosition
  const sortRec = (arr: any[]) => {
    arr.sort((a, b) => toNum(a.menuPosition) - toNum(b.menuPosition));
    for (const it of arr) sortRec(it.children);
  };
  sortRec(roots);

  return roots;
}


// Helper para menuPosition (bigint como string)
export const orderByMenuPosition = (n: AnyObj) => toPos(n?.menuPosition);
