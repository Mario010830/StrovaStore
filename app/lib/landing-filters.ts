/** Oculta tiendas de prueba u organización placeholder en la landing. */
export function isExcludedLandingStore(name: string, category: string): boolean {
  const c = category.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  if (c.includes("organización principal") || c.includes("organizacion principal")) {
    return true;
  }
  if (/\btest\b|placeholder|demo\s|^\s*demo\s*$/i.test(n) || /\btest\b|placeholder|demo/i.test(c)) {
    return true;
  }
  return false;
}
