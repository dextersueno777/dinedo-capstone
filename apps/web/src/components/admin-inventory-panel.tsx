'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  AdminInventoryItem,
  AdminStockMovement,
  InventoryItemStatus,
  InventoryUnit,
  StockMovementType,
} from '@/lib/api-types';
import {
  createAdminInventoryItem,
  createAdminStockMovement,
  getAdminInventoryItems,
  getAdminStockMovements,
  updateAdminInventoryItem,
} from '@/lib/admin-inventory-api';
import { useAuth } from './auth-provider';

const inventoryStatuses: Array<InventoryItemStatus | 'ALL'> = [
  'ACTIVE',
  'INACTIVE',
  'ALL',
];

const inventoryUnits: InventoryUnit[] = [
  'PIECE',
  'SERVING',
  'GRAM',
  'KILOGRAM',
  'MILLILITER',
  'LITER',
  'PACK',
];

const movementTypes: StockMovementType[] = [
  'PURCHASE',
  'WASTE',
  'ADJUSTMENT',
  'RETURNED',
  'ORDER_USAGE',
];

function quantity(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '0';
  return Number(value).toLocaleString('en-PH');
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function AdminInventoryPanel() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<AdminInventoryItem[]>([]);
  const [movementsByItemId, setMovementsByItemId] =
    useState<Record<string, AdminStockMovement[]>>({});
  const [filterStatus, setFilterStatus] =
    useState<InventoryItemStatus | 'ALL'>('ACTIVE');

  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newUnit, setNewUnit] = useState<InventoryUnit>('PIECE');
  const [newQuantity, setNewQuantity] = useState('0');
  const [newReorderLevel, setNewReorderLevel] = useState('0');
  const [newNotes, setNewNotes] = useState('');

  const [statusById, setStatusById] =
    useState<Record<string, InventoryItemStatus>>({});
  const [reorderById, setReorderById] = useState<Record<string, string>>({});
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const [movementTypeById, setMovementTypeById] =
    useState<Record<string, StockMovementType>>({});
  const [movementQuantityById, setMovementQuantityById] =
    useState<Record<string, string>>({});
  const [movementReasonById, setMovementReasonById] =
    useState<Record<string, string>>({});
  const [movementNotesById, setMovementNotesById] =
    useState<Record<string, string>>({});
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function loadInventory() {
    if (!token || user?.role !== 'ADMIN') {
      setItems([]);
      return;
    }

    setError('');

    try {
      const loadedItems = await getAdminInventoryItems(token, filterStatus);
      setItems(loadedItems);

      const nextStatus: Record<string, InventoryItemStatus> = {};
      const nextReorder: Record<string, string> = {};
      const nextNotes: Record<string, string> = {};
      const nextMovementType: Record<string, StockMovementType> = {};
      const nextMovementQuantity: Record<string, string> = {};
      const nextMovementReason: Record<string, string> = {};
      const nextMovementNotes: Record<string, string> = {};

      for (const item of loadedItems) {
        nextStatus[item.id] = item.status;
        nextReorder[item.id] = String(item.reorderLevel);
        nextNotes[item.id] = item.notes ?? '';
        nextMovementType[item.id] = 'PURCHASE';
        nextMovementQuantity[item.id] = '1';
        nextMovementReason[item.id] = '';
        nextMovementNotes[item.id] = '';
      }

      setStatusById(nextStatus);
      setReorderById(nextReorder);
      setNotesById(nextNotes);
      setMovementTypeById(nextMovementType);
      setMovementQuantityById(nextMovementQuantity);
      setMovementReasonById(nextMovementReason);
      setMovementNotesById(nextMovementNotes);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load inventory items.',
      );
    }
  }

  useEffect(() => {
    loadInventory();
  }, [token, user?.role, filterStatus]);

  async function handleCreateItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) return;

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const createdItem = await createAdminInventoryItem(token, {
        branchCode: 'TINOC',
        name: newName.trim(),
        sku: newSku.trim() || undefined,
        unit: newUnit,
        currentQuantity: toNumber(newQuantity),
        reorderLevel: toNumber(newReorderLevel),
        notes: newNotes.trim() || undefined,
      });

      setMessage(`Inventory item created: ${createdItem.name}`);
      setNewName('');
      setNewSku('');
      setNewUnit('PIECE');
      setNewQuantity('0');
      setNewReorderLevel('0');
      setNewNotes('');
      await loadInventory();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to create inventory item.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUpdateItem(item: AdminInventoryItem) {
    if (!token) return;

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const updatedItem = await updateAdminInventoryItem(token, item.id, {
        status: statusById[item.id] ?? item.status,
        reorderLevel: toNumber(reorderById[item.id] ?? String(item.reorderLevel)),
        notes: notesById[item.id]?.trim() || undefined,
      });

      setMessage(`Inventory item updated: ${updatedItem.name}`);
      await loadInventory();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update inventory item.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function loadMovements(itemId: string) {
    if (!token) return;

    setError('');

    try {
      const movements = await getAdminStockMovements(token, itemId);

      setMovementsByItemId((current) => ({
        ...current,
        [itemId]: movements,
      }));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load stock movements.',
      );
    }
  }

  async function handleToggleMovements(itemId: string) {
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
      return;
    }

    setExpandedItemId(itemId);
    await loadMovements(itemId);
  }


  async function handleAddMovement(item: AdminInventoryItem) {
    if (!token) return;

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const movement = await createAdminStockMovement(token, item.id, {
        type: movementTypeById[item.id] ?? 'PURCHASE',
        quantityChange: toNumber(movementQuantityById[item.id] ?? '1'),
        reason: movementReasonById[item.id]?.trim() || undefined,
        notes: movementNotesById[item.id]?.trim() || undefined,
      });

      setMessage(
        `Stock movement recorded for ${movement.inventoryItem.name}. New quantity: ${quantity(
          movement.quantityAfter,
        )}`,
      );

      await loadInventory();
      await loadMovements(item.id);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to add stock movement.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section id="admin-inventory" className="card">
      <div className="admin-inventory-heading">
        <div>
          <p className="eyebrow">Admin Module</p>
          <h2>Inventory Management</h2>
          <p>Track stock levels, reorder levels, and stock movements.</p>
        </div>

        <button className="secondary" type="button" onClick={loadInventory}>
          Refresh
        </button>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {user?.role !== 'ADMIN' ? (
        <p>Login as an admin to manage inventory.</p>
      ) : null}

      {user?.role === 'ADMIN' ? (
        <>
          <form className="admin-inventory-form" onSubmit={handleCreateItem}>
            <h3>Add Inventory Item</h3>

            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Item name"
              required
            />

            <input
              value={newSku}
              onChange={(event) => setNewSku(event.target.value)}
              placeholder="SKU optional"
            />

            <select
              value={newUnit}
              onChange={(event) => setNewUnit(event.target.value as InventoryUnit)}
            >
              {inventoryUnits.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              value={newQuantity}
              onChange={(event) => setNewQuantity(event.target.value)}
              placeholder="Current quantity"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={newReorderLevel}
              onChange={(event) => setNewReorderLevel(event.target.value)}
              placeholder="Reorder level"
            />

            <input
              value={newNotes}
              onChange={(event) => setNewNotes(event.target.value)}
              placeholder="Notes optional"
            />

            <button className="primary full-button" type="submit" disabled={isBusy}>
              Add Inventory Item
            </button>
          </form>

          <div className="admin-inventory-filter">
            <span>Filter Status</span>
            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(event.target.value as InventoryItemStatus | 'ALL')
              }
            >
              {inventoryStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="admin-inventory-list">
            {items.length === 0 ? <p>No inventory items found.</p> : null}

            {items.map((item) => {
              const isLowStock =
                Number(item.currentQuantity) <= Number(item.reorderLevel);

              return (
                <article className="admin-inventory-card" key={item.id}>
                  <div className="admin-inventory-card-header">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.sku ? `SKU: ${item.sku}` : 'No SKU'}</p>
                    </div>

                    <span className="status-pill">{item.status}</span>
                  </div>

                  <div className="admin-inventory-summary-grid">
                    <p><strong>Branch:</strong> {item.branch.name}</p>
                    <p><strong>Unit:</strong> {item.unit}</p>
                    <p><strong>Current Stock:</strong> {quantity(item.currentQuantity)}</p>
                    <p><strong>Reorder Level:</strong> {quantity(item.reorderLevel)}</p>
                    <p><strong>Stock Alert:</strong> {isLowStock ? 'Low stock' : 'Enough stock'}</p>
                    <p><strong>Updated:</strong> {new Date(item.updatedAt).toLocaleString('en-PH')}</p>
                  </div>

                  {item.notes ? (
                    <p><strong>Notes:</strong> {item.notes}</p>
                  ) : null}

                  <div className="admin-inventory-actions">
                    <select
                      value={statusById[item.id] ?? item.status}
                      onChange={(event) =>
                        setStatusById((current) => ({
                          ...current,
                          [item.id]: event.target.value as InventoryItemStatus,
                        }))
                      }
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={reorderById[item.id] ?? String(item.reorderLevel)}
                      onChange={(event) =>
                        setReorderById((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="Reorder level"
                    />

                    <input
                      value={notesById[item.id] ?? ''}
                      onChange={(event) =>
                        setNotesById((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="Item notes"
                    />

                    <button
                      className="secondary full-button"
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleUpdateItem(item)}
                    >
                      Update Item
                    </button>

                    <button
                      className="secondary full-button"
                      type="button"
                      onClick={() => handleToggleMovements(item.id)}
                    >
                      {expandedItemId === item.id ? 'Hide Movements' : 'View Movements'}
                    </button>
                  </div>

                  {expandedItemId === item.id ? (
                    <div className="admin-inventory-movements">
                      <h4>Stock Movement</h4>

                      <div className="admin-inventory-actions">
                        <select
                          value={movementTypeById[item.id] ?? 'PURCHASE'}
                          onChange={(event) =>
                            setMovementTypeById((current) => ({
                              ...current,
                              [item.id]: event.target.value as StockMovementType,
                            }))
                          }
                        >
                          {movementTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>

                        <input
                          type="number"
                          step="0.01"
                          value={movementQuantityById[item.id] ?? '1'}
                          onChange={(event) =>
                            setMovementQuantityById((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder="Quantity change"
                        />

                        <input
                          value={movementReasonById[item.id] ?? ''}
                          onChange={(event) =>
                            setMovementReasonById((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder="Reason"
                        />

                        <input
                          value={movementNotesById[item.id] ?? ''}
                          onChange={(event) =>
                            setMovementNotesById((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder="Movement notes"
                        />

                        <button
                          className="secondary full-button"
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleAddMovement(item)}
                        >
                          Record Movement
                        </button>
                      </div>

                      <div className="admin-inventory-history">
                        <h4>Movement History</h4>

                        {(movementsByItemId[item.id] ?? []).length === 0 ? (
                          <p>No stock movement history found.</p>
                        ) : null}

                        {(movementsByItemId[item.id] ?? []).map((movement) => (
                          <div className="admin-inventory-movement" key={movement.id}>
                            <p><strong>{movement.type}</strong></p>
                            <p>Change: {quantity(movement.quantityChange)}</p>
                            <p>After: {quantity(movement.quantityAfter)}</p>
                            <p>Reason: {movement.reason ?? 'No reason'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}
