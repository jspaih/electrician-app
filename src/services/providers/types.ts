/**
 * DataProvider interface — contract that every backend must honor.
 *
 * All methods return Promises, even for the local provider. This
 * keeps call sites backend-agnostic: they write `await` once and
 * it works whether the data is in memory or over the network.
 *
 * The interface intentionally mirrors the subset of the store's
 * API that the UI consumes. Derived calculations (bank balance,
 * project financials, etc.) are NOT part of this contract — a
 * real backend would compute those server-side; today they stay
 * local (see dataService).
 */

import type {
  Client, Project, Item, StockMovement, Supplier,
  BankAccount, Payment, Check, BankTransfer, Receipt,
  Quotation, WorkOrder, Employee, LaborEntry, Warranty,
  PhotoAttachment, AppSettings, CheckStatus,
} from '../../types'

/** Generic CRUD surface used by most entity types. */
export interface CrudProvider<T, CreateInput> {
  list():                                 Promise<T[]>
  get(id: string):                        Promise<T | undefined>
  create(data: CreateInput):              Promise<T>
  update(id: string, data: Partial<T>):   Promise<void>
  remove(id: string):                     Promise<void>
}

export interface DataProvider {
  readonly name: 'local' | 'remote'

  clients:       CrudProvider<Client,      Omit<Client,      'id' | 'createdAt'>>
  projects:      CrudProvider<Project,     Omit<Project,     'id' | 'createdAt'>>
  items:         CrudProvider<Item,        Omit<Item,        'id' | 'createdAt'>>
  suppliers:     CrudProvider<Supplier,    Omit<Supplier,    'id' | 'createdAt'>>
  banks:         CrudProvider<BankAccount, Omit<BankAccount, 'id' | 'createdAt'>>
  payments:      CrudProvider<Payment,     Omit<Payment,     'id' | 'createdAt'>>
  checks:        CrudProvider<Check,       Omit<Check,       'id' | 'createdAt'>>
  transfers:     CrudProvider<BankTransfer,Omit<BankTransfer,'id' | 'createdAt'>>
  receipts:      CrudProvider<Receipt,     Omit<Receipt,     'id' | 'createdAt'>>
  quotations:    CrudProvider<Quotation,   Omit<Quotation,   'id' | 'createdAt'>>
  workOrders:    CrudProvider<WorkOrder,   Omit<WorkOrder,   'id' | 'createdAt'>>
  employees:     CrudProvider<Employee,    Omit<Employee,    'id' | 'createdAt'>>
  laborEntries:  CrudProvider<LaborEntry,  Omit<LaborEntry,  'id' | 'createdAt'>>
  warranties:    CrudProvider<Warranty,    Omit<Warranty,    'id' | 'createdAt'>>

  // Stock movements & photos have no `createdAt` on the entity; they
  // follow a slightly different create shape.
  stockMovements: {
    list():                                         Promise<StockMovement[]>
    create(data: Omit<StockMovement, 'id'>):        Promise<StockMovement>
    remove(id: string):                             Promise<void>
  }

  photos: {
    list():                                                         Promise<PhotoAttachment[]>
    create(data: Omit<PhotoAttachment, 'id'>):                      Promise<PhotoAttachment>
    remove(id: string):                                             Promise<void>
    listFor(entityType: string, entityId: string):                  Promise<PhotoAttachment[]>
  }

  checksBulk: {
    updateStatus(ids: string[], status: CheckStatus, extra?: Partial<Check>): Promise<void>
  }

  settings: {
    get():                          Promise<AppSettings>
    update(data: Partial<AppSettings>): Promise<void>
  }

  /**
   * Cross-entity operation that today lives in the store. Kept on
   * the provider so a real backend can implement it as a single
   * transactional endpoint.
   */
  convertQuotationToProject(quotationId: string): Promise<Project | null>
}
