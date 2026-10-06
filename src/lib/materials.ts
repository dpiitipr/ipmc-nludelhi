export type MaterialFile = { id: string; url: string; name: string; type: string };
export type MaterialItem = { id: string; title: string; files: MaterialFile[] };

// `file` is a multi-value asset field, so it is a list. A single object is also accepted.
export const getFiles = (m: any): MaterialFile[] => {
  const raw = m?.file ?? m?.files ?? null;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : m?.url ? [m] : [];
  return list
    .filter((f: any) => f && typeof f.url === 'string' && f.url.trim())
    .map((f: any, i: number) => ({
      id: f.id || `${f.url}-${i}`,
      url: f.url.trim(),
      name: f.fileName || '',
      type: String(f.mimeType || '').includes('/')
        ? String(f.mimeType).split('/')[1].toUpperCase().slice(0, 4)
        : 'PDF',
    }));
};

// "Best Memo A.pdf" -> "A", "Best Memo R.pdf" -> "R"; otherwise "File 1", "File 2".
// A single file is just "Download".
export const fileLabel = (f: MaterialFile, index: number, total: number) => {
  if (total === 1) return 'Download';
  const base = f.name.replace(/\.[^.]+$/, '').trim();
  const m = base.match(/(?:^|[\s_\-()])([A-Za-z])$/);
  return m ? m[1].toUpperCase() : `File ${index + 1}`;
};

export const normalizeMaterials = (list: any, prefix = 'material'): MaterialItem[] => {
  if (!Array.isArray(list)) return [];
  return list.map((m: any, i: number) => {
    const files = getFiles(m);
    return {
      id: m.id || `${prefix}-${i}`,
      title: m.title || files[0]?.name || 'Document',
      files,
    };
  });
};

export const hasAnyFile = (list: any) =>
  Array.isArray(list) && list.some((m) => getFiles(m).length > 0);