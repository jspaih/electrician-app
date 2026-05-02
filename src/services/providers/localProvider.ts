/**
 * localProvider — reads/writes go through the Zustand store.
 *
 * This is the current behavior, just dressed in the async provider
 * contract. Every method wraps a synchronous store call in
 * Promise.resolve(), so call sites that await it get identical
 * timing semantics to today.
 *
 * Nothing in this file changes what's persisted, how it's
 * persisted, or the shape of the data. Swapping to remoteProvider
 * must be a one-line flag change and nothing else.
 */

import { useStore } from '../../store/useStore'
import type { DataProvider } from './types'

const s = () => useStore.getState()

/** Tiny helper: resolve a value immediately to match the async contract. */
const done = <T>(v: T): Promise<T> => Promise.resolve(v)

export const localProvider: DataProvider = {
  name: 'local',

  clients: {
    list:   ()             => done(s().clients),
    get:    (id)           => done(s().clients.find(c => c.id === id)),
    create: (data)         => done(s().addClient(data)),
    update: (id, data)     => { s().updateClient(id, data); return done(undefined) },
    remove: (id)           => { s().deleteClient(id);       return done(undefined) },
  },

  projects: {
    list:   ()             => done(s().projects),
    get:    (id)           => done(s().projects.find(p => p.id === id)),
    create: (data)         => done(s().addProject(data)),
    update: (id, data)     => { s().updateProject(id, data); return done(undefined) },
    remove: (id)           => { s().deleteProject(id);       return done(undefined) },
  },

  items: {
    list:   ()             => done(s().items),
    get:    (id)           => done(s().items.find(i => i.id === id)),
    create: (data)         => done(s().addItem(data)),
    update: (id, data)     => { s().updateItem(id, data); return done(undefined) },
    remove: (id)           => { s().deleteItem(id);       return done(undefined) },
  },

  suppliers: {
    list:   ()             => done(s().suppliers),
    get:    (id)           => done(s().suppliers.find(x => x.id === id)),
    create: (data)         => done(s().addSupplier(data)),
    update: (id, data)     => { s().updateSupplier(id, data); return done(undefined) },
    remove: (id)           => { s().deleteSupplier(id);       return done(undefined) },
  },

  banks: {
    list:   ()             => done(s().banks),
    get:    (id)           => done(s().banks.find(b => b.id === id)),
    create: (data)         => done(s().addBank(data)),
    update: (id, data)     => { s().updateBank(id, data); return done(undefined) },
    remove: (id)           => { s().deleteBank(id);       return done(undefined) },
  },

  payments: {
    list:   ()             => done(s().payments),
    get:    (id)           => done(s().payments.find(p => p.id === id)),
    create: (data)         => done(s().addPayment(data)),
    update: (id, data)     => { s().updatePayment(id, data); return done(undefined) },
    remove: (id)           => { s().deletePayment(id);       return done(undefined) },
  },

  checks: {
    list:   ()             => done(s().checks),
    get:    (id)           => done(s().checks.find(c => c.id === id)),
    create: (data)         => done(s().addCheck(data)),
    update: (id, data)     => { s().updateCheck(id, data); return done(undefined) },
    remove: (id)           => { s().deleteCheck(id);       return done(undefined) },
  },

  transfers: {
    list:   ()             => done(s().transfers),
    get:    (id)           => done(s().transfers.find(t => t.id === id)),
    create: (data)         => done(s().addTransfer(data)),
    update: (id, data)     => { s().updateTransfer(id, data); return done(undefined) },
    remove: (id)           => { s().deleteTransfer(id);       return done(undefined) },
  },

  receipts: {
    list:   ()             => done(s().receipts),
    get:    (id)           => done(s().receipts.find(r => r.id === id)),
    create: (data)         => done(s().addReceipt(data)),
    update: (id, data)     => { s().updateReceipt(id, data); return done(undefined) },
    remove: (id)           => { s().deleteReceipt(id);       return done(undefined) },
  },

  quotations: {
    list:   ()             => done(s().quotations),
    get:    (id)           => done(s().quotations.find(q => q.id === id)),
    create: (data)         => done(s().addQuotation(data)),
    update: (id, data)     => { s().updateQuotation(id, data); return done(undefined) },
    remove: (id)           => { s().deleteQuotation(id);       return done(undefined) },
  },

  workOrders: {
    list:   ()             => done(s().workOrders),
    get:    (id)           => done(s().workOrders.find(w => w.id === id)),
    create: (data)         => done(s().addWorkOrder(data)),
    update: (id, data)     => { s().updateWorkOrder(id, data); return done(undefined) },
    remove: (id)           => { s().deleteWorkOrder(id);       return done(undefined) },
  },

  employees: {
    list:   ()             => done(s().employees),
    get:    (id)           => done(s().employees.find(e => e.id === id)),
    create: (data)         => done(s().addEmployee(data)),
    update: (id, data)     => { s().updateEmployee(id, data); return done(undefined) },
    remove: (id)           => { s().deleteEmployee(id);       return done(undefined) },
  },

  laborEntries: {
    list:   ()             => done(s().laborEntries),
    get:    (id)           => done(s().laborEntries.find(l => l.id === id)),
    create: (data)         => done(s().addLaborEntry(data)),
    update: (id, data)     => { s().updateLaborEntry(id, data); return done(undefined) },
    remove: (id)           => { s().deleteLaborEntry(id);       return done(undefined) },
  },

  warranties: {
    list:   ()             => done(s().warranties),
    get:    (id)           => done(s().warranties.find(w => w.id === id)),
    create: (data)         => done(s().addWarranty(data)),
    update: (id, data)     => { s().updateWarranty(id, data); return done(undefined) },
    remove: (id)           => { s().deleteWarranty(id);       return done(undefined) },
  },

  stockMovements: {
    list:   ()             => done(s().stockMovements),
    create: (data)         => done(s().addStockMovement(data)),
    remove: (id)           => { s().deleteStockMovement(id); return done(undefined) },
  },

  photos: {
    list:    ()                       => done(s().photos),
    create:  (data)                   => done(s().addPhoto(data)),
    remove:  (id)                     => { s().deletePhoto(id); return done(undefined) },
    listFor: (entityType, entityId)   => done(s().getPhotos(entityType, entityId)),
  },

  checksBulk: {
    updateStatus: (ids, status, extra) => {
      s().bulkUpdateCheckStatus(ids, status, extra)
      return done(undefined)
    },
  },

  settings: {
    get:    ()     => done(s().settings),
    update: (data) => { s().updateSettings(data); return done(undefined) },
  },

  convertQuotationToProject: (quotationId) =>
    done(s().convertQuotationToProject(quotationId)),
}
