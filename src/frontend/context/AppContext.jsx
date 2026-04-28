/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import { fakeApi } from '../services/fakeApi'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, setState] = useState(() => fakeApi.bootstrap())
  const [currentUser, setCurrentUser] = useState(null)

  const persist = (updater) => {
    setState((previous) => {
      const next = typeof updater === 'function' ? updater(previous) : updater
      fakeApi.saveState(next)
      return next
    })
  }

  const login = (email, password) => {
    const user = state.users.find((item) => item.email === email && item.password === password)
    if (!user) return { ok: false, message: 'Credenciales invalidas' }
    setCurrentUser(user)
    return { ok: true }
  }

  const logout = () => setCurrentUser(null)

  const updateProfile = (values) => {
    if (!currentUser) return
    persist((previous) => {
      const users = previous.users.map((item) => (item.id === currentUser.id ? { ...item, ...values } : item))
      const updated = users.find((item) => item.id === currentUser.id)
      setCurrentUser(updated)
      return { ...previous, users }
    })
  }

  const changePassword = (nextPassword) => updateProfile({ password: nextPassword })

  const addSupplierPayment = (payment) => {
    persist((previous) => ({
      ...previous,
      supplierPayments: [{ id: crypto.randomUUID(), ...payment }, ...previous.supplierPayments],
    }))
  }

  const addSupplier = (supplier) => {
    persist((previous) => ({
      ...previous,
      suppliers: [{ id: crypto.randomUUID(), active: true, ...supplier }, ...previous.suppliers],
    }))
  }

  const toggleSupplier = (id) => {
    persist((previous) => ({
      ...previous,
      suppliers: previous.suppliers.map((item) => (item.id === id ? { ...item, active: !item.active } : item)),
    }))
  }

  const addPaymentRequest = (request) => {
    persist((previous) => ({
      ...previous,
      paymentRequests: [{ id: crypto.randomUUID(), status: 'Pendiente', ...request }, ...previous.paymentRequests],
    }))
  }

  const updatePaymentRequestStatus = (id, status) => {
    persist((previous) => ({
      ...previous,
      paymentRequests: previous.paymentRequests.map((item) => (item.id === id ? { ...item, status } : item)),
    }))
  }

  const createPaymentOrder = (requestId) => {
    persist((previous) => {
      const request = previous.paymentRequests.find((item) => item.id === requestId)
      if (!request) return previous
      return {
        ...previous,
        paymentOrders: [
          { id: crypto.randomUUID(), requestId, supplier: request.supplier, amount: request.amount, issueDate: new Date().toISOString().slice(0, 10), status: 'Emitida' },
          ...previous.paymentOrders,
        ],
      }
    })
  }

  const markPaymentAsPaid = (id) => {
    persist((previous) => ({
      ...previous,
      supplierPayments: previous.supplierPayments.map((item) => (item.id === id ? { ...item, status: 'Pagado' } : item)),
    }))
  }

  const addKioskSale = (sale) => {
    persist((previous) => {
      const product = previous.kioskProducts.find((item) => item.id === sale.productId)
      if (!product) return previous
      const quantity = Number(sale.quantity)
      const total = product.price * quantity

      return {
        ...previous,
        kioskSales: [
          { id: crypto.randomUUID(), product: product.name, quantity, total, date: new Date().toISOString().slice(0, 10), branch: sale.branch },
          ...previous.kioskSales,
        ],
        kioskProducts: previous.kioskProducts.map((item) => (item.id === product.id ? { ...item, stock: Math.max(item.stock - quantity, 0) } : item)),
      }
    })
  }

  const addRestockOrder = (order) => {
    persist((previous) => ({
      ...previous,
      restockOrders: [{ id: crypto.randomUUID(), ...order, status: 'Solicitado' }, ...previous.restockOrders],
    }))
  }

  const addProduct = (product) => {
    persist((previous) => ({
      ...previous,
      kioskProducts: [{ id: crypto.randomUUID(), ...product }, ...previous.kioskProducts],
    }))
  }

  const addStockMovement = (movement) => {
    persist((previous) => ({
      ...previous,
      stockMovements: [{ id: crypto.randomUUID(), ...movement, date: new Date().toISOString().slice(0, 10) }, ...previous.stockMovements],
    }))
  }

  const addVoucher = (voucher) => {
    persist((previous) => ({
      ...previous,
      vouchers: [{ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), ...voucher }, ...previous.vouchers],
    }))
  }

  const addShiftNote = (note) => {
    persist((previous) => ({
      ...previous,
      shiftNotes: [{ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), ...note }, ...previous.shiftNotes],
    }))
  }

  const addDailyClosure = (closure) => {
    persist((previous) => ({
      ...previous,
      dailyClosures: [{ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), ...closure }, ...previous.dailyClosures],
    }))
  }

  const value = {
    state,
    currentUser,
    login,
    logout,
    updateProfile,
    changePassword,
    addSupplierPayment,
    markPaymentAsPaid,
    addSupplier,
    toggleSupplier,
    addPaymentRequest,
    updatePaymentRequestStatus,
    createPaymentOrder,
    addKioskSale,
    addRestockOrder,
    addProduct,
    addStockMovement,
    addVoucher,
    addShiftNote,
    addDailyClosure,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp debe usarse dentro de AppProvider')
  return context
}
