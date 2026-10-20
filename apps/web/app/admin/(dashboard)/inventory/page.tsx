'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ApiError, apiGet, apiSend, DEMO_MODE } from '@/lib/api';
import { demoInventory, demoStockMovements } from '@/lib/demo-data';
import { cn, formatDateTime, formatRupiah } from '@/lib/format';
import type { InventoryItem, StockMovement } from '@/lib/types';
import {
  AdminLoading,
  AdminPageHeader,
  DemoActionNote,
  EmptyState,
  SourceNotice,
  type DataSource,
} from '@/components/admin/AdminUI';

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

const MOVEMENT_LABEL: Record<MovementType, string> = {
  IN: 'Barang masuk',
  OUT: 'Barang keluar',
  ADJUSTMENT: 'Stok opname',
};

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Tindakan tidak dapat diproses.';
}

const EMPTY_ITEM = {
  sku: '',
  name: '',
  category: '',
  unit: 'pcs',
  quantity: '0',
  minQuantity: '0',
  costPrice: '0',
};

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [source, setSource] = useState<DataSource>('api');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [savingItem, setSavingItem] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>('IN');
  const [movementQty, setMovementQty] = useState('');
  const [movementNote, setMovementNote] = useState('');
  const [savingMovement, setSavingMovement] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (DEMO_MODE) {
      setItems(demoInventory);
      setSource('demo');
      setLoading(false);
      return;
    }
    apiGet<InventoryItem[]>('/admin/inventory')
      .then((rows) => {
        if (active) setItems(rows);
      })
      .catch(() => {
        if (!active) return;
        setItems(demoInventory);
        setSource('fallback');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const simulate = source !== 'api';
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items],
  );

  useEffect(() => {
    if (!selectedId) {
      setMovements([]);
      return;
    }
    let active = true;

    if (simulate) {
      setMovements(demoStockMovements);
      setLoadingMovements(false);
      return;
    }

    setLoadingMovements(true);
    apiGet<StockMovement[]>(`/admin/inventory/${selectedId}/movements?limit=20`)
      .then((rows) => {
        if (active) setMovements(rows);
      })
      .catch(() => {
        if (active) setMovements([]);
      })
      .finally(() => {
        if (active) setLoadingMovements(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId, simulate]);

  const filtered = items.filter((item) => {
    if (lowOnly && item.quantity > item.minQuantity) return false;
    if (category && item.category !== category) return false;
    if (search) {
      const haystack = `${item.sku} ${item.name} ${item.category}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const lowCount = items.filter((item) => item.quantity <= item.minQuantity).length;
  const stockValue = items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSavingItem(true);
    try {
      const payload = {
        sku: itemForm.sku.trim().toUpperCase(),
        name: itemForm.name.trim(),
        category: itemForm.category.trim(),
        unit: itemForm.unit.trim() || 'pcs',
        quantity: Number(itemForm.quantity),
        minQuantity: Number(itemForm.minQuantity),
        costPrice: Number(itemForm.costPrice),
        isActive: true,
      };

      if (simulate) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        const created: InventoryItem = {
          id: `inv-demo-${Date.now()}`,
          ...payload,
          isLowStock: payload.quantity <= payload.minQuantity,
        };
        setItems((current) => [created, ...current]);
        setNotice('Barang demo ditambahkan. Data hanya berlaku di layar ini.');
      } else {
        const created = await apiSend<InventoryItem>('/admin/inventory', 'POST', payload);
        setItems((current) => [
          {
            ...created,
            costPrice: Number(created.costPrice),
            isLowStock: created.quantity <= created.minQuantity,
          },
          ...current,
        ]);
        setNotice(`${created.name} ditambahkan ke stok.`);
      }
      setItemForm(EMPTY_ITEM);
      setShowAddForm(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingItem(false);
    }
  }

  async function handleMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setError(null);
    setNotice(null);

    const quantity = Number(movementQty);
    if (!Number.isFinite(quantity) || quantity < 0) {
      setError('Jumlah harus berupa angka 0 atau lebih.');
      return;
    }
    if (movementType !== 'ADJUSTMENT' && quantity < 1) {
      setError('Jumlah minimal 1.');
      return;
    }

    setSavingMovement(true);
    try {
      if (simulate) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        const delta =
          movementType === 'IN'
            ? quantity
            : movementType === 'OUT'
              ? -quantity
              : quantity - selected.quantity;
        if (movementType === 'ADJUSTMENT' && delta === 0) {
          setError('Stok fisik sama dengan catatan saat ini.');
          return;
        }
        if (selected.quantity + delta < 0) {
          setError(`Stok tidak mencukupi. Tersedia ${selected.quantity} ${selected.unit}.`);
          return;
        }
        const movement: StockMovement = {
          id: `sm-demo-${Date.now()}`,
          type: movementType,
          quantity: delta,
          note: movementNote.trim() || null,
          createdAt: new Date().toISOString(),
          createdBy: { name: 'GCC Admin (demo)' },
        };
        setItems((current) =>
          current.map((item) =>
            item.id === selected.id
              ? {
                  ...item,
                  quantity: item.quantity + delta,
                  isLowStock: item.quantity + delta <= item.minQuantity,
                }
              : item,
          ),
        );
        setMovements((current) => [movement, ...current]);
        setNotice(`Mutasi demo dicatat: ${MOVEMENT_LABEL[movementType]} ${quantity} ${selected.unit}.`);
      } else {
        const result = await apiSend<{ movement: StockMovement; item: InventoryItem }>(
          `/admin/inventory/${selected.id}/movements`,
          'POST',
          {
            type: movementType,
            quantity,
            note: movementNote.trim() || undefined,
          },
        );
        setItems((current) =>
          current.map((item) =>
            item.id === selected.id
              ? {
                  ...result.item,
                  costPrice: Number(result.item.costPrice),
                  isLowStock: result.item.quantity <= result.item.minQuantity,
                }
              : item,
          ),
        );
        setMovements((current) => [result.movement, ...current]);
        setNotice(`${MOVEMENT_LABEL[movementType]} ${quantity} ${selected.unit} dicatat.`);
      }
      setMovementQty('');
      setMovementNote('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingMovement(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Stok"
        title="Persediaan & mutasi"
        description="Catat barang masuk, pemakaian untuk pesanan, dan hasil stok opname."
        actions={
          <button
            type="button"
            onClick={() => {
              setShowAddForm((value) => !value);
              setError(null);
            }}
            className="border border-ink bg-ink px-3 py-2 text-[0.7rem] font-semibold text-bone transition-colors hover:border-teal hover:bg-teal"
          >
            {showAddForm ? 'Tutup formulir' : 'Tambah barang'}
          </button>
        }
      />

      <SourceNotice source={source} />
      {simulate && !DEMO_MODE ? (
        <DemoActionNote>
          API tidak terhubung. Mutasi di bawah hanya memperbarui data di layar ini.
        </DemoActionNote>
      ) : null}

      {error ? (
        <p role="alert" className="border border-rust/30 bg-rust/5 px-3 py-2 text-[0.74rem] text-rust">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="border border-teal/25 bg-teal-soft/50 px-3 py-2 text-[0.74rem]">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Jenis barang</p>
          <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{items.length}</p>
        </div>
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Di bawah minimum</p>
          <p className="mt-1 text-[1.2rem] font-bold tabular-nums text-rust">{lowCount}</p>
        </div>
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Nilai persediaan</p>
          <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{formatRupiah(stockValue)}</p>
        </div>
      </div>

      {showAddForm ? (
        <form onSubmit={handleAddItem} className="border border-line bg-paper p-4 sm:p-5">
          <h2 className="text-[0.95rem] font-bold tracking-[-0.02em]">Barang baru</h2>
          <p className="mt-1 text-[0.7rem] text-muted">
            Stok awal dicatat tanpa mutasi. Gunakan stok opname untuk koreksi berikutnya.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label htmlFor="item-sku" className="field-label">
                SKU
              </label>
              <input
                id="item-sku"
                required
                minLength={2}
                maxLength={40}
                value={itemForm.sku}
                onChange={(event) => setItemForm({ ...itemForm, sku: event.target.value })}
                className="field uppercase"
                placeholder="FRN-R32"
              />
            </div>
            <div>
              <label htmlFor="item-name" className="field-label">
                Nama barang
              </label>
              <input
                id="item-name"
                required
                minLength={2}
                maxLength={120}
                value={itemForm.name}
                onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })}
                className="field"
                placeholder="Freon R32"
              />
            </div>
            <div>
              <label htmlFor="item-category" className="field-label">
                Kategori
              </label>
              <input
                id="item-category"
                required
                minLength={2}
                maxLength={60}
                list="inventory-categories"
                value={itemForm.category}
                onChange={(event) => setItemForm({ ...itemForm, category: event.target.value })}
                className="field"
                placeholder="Freon"
              />
              <datalist id="inventory-categories">
                {categories.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="item-unit" className="field-label">
                Satuan
              </label>
              <input
                id="item-unit"
                required
                maxLength={20}
                value={itemForm.unit}
                onChange={(event) => setItemForm({ ...itemForm, unit: event.target.value })}
                className="field"
                placeholder="pcs / kg / meter"
              />
            </div>
            <div>
              <label htmlFor="item-quantity" className="field-label">
                Stok awal
              </label>
              <input
                id="item-quantity"
                type="number"
                min={0}
                required
                value={itemForm.quantity}
                onChange={(event) => setItemForm({ ...itemForm, quantity: event.target.value })}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="item-min" className="field-label">
                Batas minimum
              </label>
              <input
                id="item-min"
                type="number"
                min={0}
                required
                value={itemForm.minQuantity}
                onChange={(event) => setItemForm({ ...itemForm, minQuantity: event.target.value })}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="item-cost" className="field-label">
                Harga beli / satuan
              </label>
              <input
                id="item-cost"
                type="number"
                min={0}
                step={1000}
                required
                value={itemForm.costPrice}
                onChange={(event) => setItemForm({ ...itemForm, costPrice: event.target.value })}
                className="field"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={savingItem}
                className="w-full border border-ink bg-ink px-3 py-2 text-[0.7rem] font-semibold text-bone transition-colors hover:border-teal hover:bg-teal disabled:opacity-50"
              >
                {savingItem ? 'Menyimpan…' : 'Simpan barang'}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {selected ? (
        <section className="border border-teal/25 bg-paper">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal/20 bg-teal-soft/40 px-4 py-3">
            <div>
              <p className="text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-teal">
                Mutasi stok
              </p>
              <h2 className="mt-0.5 text-[0.9rem] font-bold">
                {selected.name}{' '}
                <span className="font-normal text-muted">
                  · {selected.quantity} {selected.unit} tersedia
                </span>
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setMovementQty('');
                setMovementNote('');
              }}
              className="border border-teal/25 bg-paper px-2.5 py-1.5 text-[0.64rem] font-semibold text-teal"
            >
              Tutup
            </button>
          </div>

          <div className="grid gap-5 p-4 lg:grid-cols-[1fr_1.2fr]">
            <form onSubmit={handleMovement} className="space-y-3">
              <div>
                <label htmlFor="movement-type" className="field-label">
                  Jenis mutasi
                </label>
                <select
                  id="movement-type"
                  value={movementType}
                  onChange={(event) => setMovementType(event.target.value as MovementType)}
                  className="field"
                >
                  {(Object.keys(MOVEMENT_LABEL) as MovementType[]).map((type) => (
                    <option key={type} value={type}>
                      {MOVEMENT_LABEL[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="movement-qty" className="field-label">
                  {movementType === 'ADJUSTMENT'
                    ? `Jumlah fisik (${selected.unit})`
                    : `Jumlah (${selected.unit})`}
                </label>
                <input
                  id="movement-qty"
                  type="number"
                  min={movementType === 'ADJUSTMENT' ? 0 : 1}
                  required
                  value={movementQty}
                  onChange={(event) => setMovementQty(event.target.value)}
                  className="field"
                  placeholder={movementType === 'ADJUSTMENT' ? String(selected.quantity) : '1'}
                />
                <p className="field-hint">
                  {movementType === 'IN'
                    ? 'Menambah stok.'
                    : movementType === 'OUT'
                      ? 'Mengurangi stok; tidak boleh melebihi jumlah tersedia.'
                      : 'Masukkan hitungan fisik, bukan selisih.'}
                </p>
              </div>
              <div>
                <label htmlFor="movement-note" className="field-label">
                  Catatan <span className="font-normal normal-case text-muted">(opsional)</span>
                </label>
                <input
                  id="movement-note"
                  maxLength={200}
                  value={movementNote}
                  onChange={(event) => setMovementNote(event.target.value)}
                  className="field"
                  placeholder="Pembelian supplier / dipakai untuk pesanan"
                />
              </div>
              <button
                type="submit"
                disabled={savingMovement || !movementQty}
                className="w-full border border-ink bg-ink px-3 py-2 text-[0.7rem] font-semibold text-bone transition-colors hover:border-teal hover:bg-teal disabled:opacity-50"
              >
                {savingMovement ? 'Menyimpan…' : 'Catat mutasi'}
              </button>
            </form>

            <div>
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">
                Mutasi terakhir
              </p>
              {loadingMovements ? (
                <p className="mt-3 text-[0.72rem] text-muted">Memuat…</p>
              ) : movements.length === 0 ? (
                <p className="mt-3 border border-dashed border-line px-3 py-4 text-center text-[0.72rem] text-muted">
                  Belum ada mutasi tercatat.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-line/70">
                  {movements.slice(0, 8).map((movement) => (
                    <li key={movement.id} className="flex items-baseline justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[0.72rem] font-medium">
                          {MOVEMENT_LABEL[movement.type]}{' '}
                          <span
                            className={cn(
                              'tabular-nums',
                              movement.quantity > 0 ? 'text-teal' : 'text-rust',
                            )}
                          >
                            {movement.quantity > 0 ? '+' : ''}
                            {movement.quantity}
                          </span>
                        </p>
                        <p className="truncate text-[0.6rem] text-muted">
                          {formatDateTime(movement.createdAt)}
                          {movement.note ? ` · ${movement.note}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-[0.58rem] text-muted">
                        {movement.createdBy?.name ?? '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 border border-line bg-paper p-3 sm:grid-cols-[1fr_12rem_auto]">
        <div>
          <label htmlFor="inventory-search" className="field-label">
            Cari
          </label>
          <input
            id="inventory-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="field"
            placeholder="Nama atau SKU"
          />
        </div>
        <div>
          <label htmlFor="inventory-category" className="field-label">
            Kategori
          </label>
          <select
            id="inventory-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="field"
          >
            <option value="">Semua kategori</option>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-[0.7rem]">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(event) => setLowOnly(event.target.checked)}
            className="h-4 w-4 accent-[#0B5D4F]"
          />
          Hanya yang menipis
        </label>
      </div>

      {loading ? (
        <AdminLoading label="Memuat persediaan…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada barang yang cocok"
          body="Ubah kata kunci atau filter kategori untuk melihat barang lain."
        />
      ) : (
        <section className="border border-line bg-paper">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-surface/60 text-[0.58rem] uppercase tracking-[0.1em] text-muted">
                  <th className="px-4 py-2.5 font-semibold">SKU / barang</th>
                  <th className="px-3 py-2.5 font-semibold">Kategori</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Stok</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Minimum</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Harga beli</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const low = item.quantity <= item.minQuantity;
                  return (
                    <tr key={item.id} className="border-b border-line/60 last:border-b-0">
                      <td className="px-4 py-2.5">
                        <p className="ticket-code text-[0.62rem] font-semibold text-muted">
                          {item.sku}
                        </p>
                        <p className="text-[0.76rem] font-medium">{item.name}</p>
                      </td>
                      <td className="px-3 py-2.5 text-[0.7rem] text-muted">{item.category}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={cn(
                            'text-[0.76rem] font-semibold tabular-nums',
                            low ? 'text-rust' : 'text-ink',
                          )}
                        >
                          {item.quantity} {item.unit}
                        </span>
                        {low ? (
                          <span className="ml-1.5 border border-rust/25 bg-rust/5 px-1 py-0.5 text-[0.5rem] font-semibold uppercase text-rust">
                            Low
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[0.7rem] tabular-nums text-muted">
                        {item.minQuantity}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[0.7rem] tabular-nums">
                        {formatRupiah(item.costPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(item.id);
                            setMovementQty('');
                            setMovementNote('');
                            setError(null);
                          }}
                          className="border border-line px-2 py-1 text-[0.62rem] font-semibold transition-colors hover:border-ink"
                        >
                          Mutasi
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
