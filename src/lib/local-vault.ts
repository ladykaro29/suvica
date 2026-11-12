/**
 * Bóveda automática de respaldo en el navegador (localStorage) + Auto-Sincronización.
 * Garantiza que ningún registro capturado en un teléfono o PC se pierda jamás,
 * incluso si se corta el internet o se reinicia un contenedor.
 */

export interface VaultDispositivo {
  id: string;
  codigoInventario: string | null;
  tipoEquipo: "Laptop" | "Celular" | "Radio" | "Otro";
  propiedad?: string;
  marcaModelo: string | null;
  serial: string | null;
  especificaciones: string | null;
  macAddress: string | null;
  imei1: string | null;
  imei2: string | null;
  firmaConformidad?: string | null;
  createdAt: string;
  trabajador: {
    id: string;
    cedula: string;
    nombre: string;
    cargo: string;
    departamento: string;
    empresa: string;
  };
}

const VAULT_STORAGE_KEY = "suvica_inventario_vault_v1";
const DELETED_IDS_KEY = "suvica_inventario_deleted_ids_v1";

export function getLocalVaultDevices(): VaultDispositivo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getDeletedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DELETED_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markDeviceDeletedInVault(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const deleted = getDeletedIds();
    deleted.add(id);
    window.localStorage.setItem(
      DELETED_IDS_KEY,
      JSON.stringify(Array.from(deleted))
    );
    const current = getLocalVaultDevices().filter((d) => d.id !== id);
    window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
}

export function saveDeviceToLocalVault(device: VaultDispositivo): void {
  if (typeof window === "undefined" || !device?.id || !device?.trabajador) {
    return;
  }
  try {
    const current = getLocalVaultDevices();
    const idx = current.findIndex((d) => d.id === device.id);
    if (idx !== -1) {
      current[idx] = device;
    } else {
      current.unshift(device);
    }
    window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore quota errors
  }
}

export function mergeServerDevicesWithVault(
  serverDevices: VaultDispositivo[]
): {
  merged: VaultDispositivo[];
  missingOnServer: VaultDispositivo[];
} {
  if (typeof window === "undefined") {
    return { merged: serverDevices, missingOnServer: [] };
  }

  const deletedIds = getDeletedIds();
  const vaultDevices = getLocalVaultDevices().filter(
    (d) => !deletedIds.has(d.id)
  );

  const serverByKey = new Set<string>();
  for (const s of serverDevices) {
    serverByKey.add(s.id);
    const compositeKey = `${s.trabajador?.cedula || ""}|${s.tipoEquipo}|${
      s.serial || ""
    }|${s.macAddress || ""}|${s.imei1 || ""}|${s.marcaModelo || ""}`;
    serverByKey.add(compositeKey);
  }

  const missingOnServer: VaultDispositivo[] = [];
  for (const localDev of vaultDevices) {
    const compositeKey = `${localDev.trabajador?.cedula || ""}|${
      localDev.tipoEquipo
    }|${localDev.serial || ""}|${localDev.macAddress || ""}|${
      localDev.imei1 || ""
    }|${localDev.marcaModelo || ""}`;

    if (!serverByKey.has(localDev.id) && !serverByKey.has(compositeKey)) {
      missingOnServer.push(localDev);
    }
  }

  const merged = [...serverDevices, ...missingOnServer];
  try {
    window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore quota errors
  }

  return { merged, missingOnServer };
}
