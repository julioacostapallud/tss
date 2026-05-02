export const getStockStatus = (stockActual, stockMinimo) => {
  if (stockActual <= 0) return 'agotado'
  if (stockActual <= stockMinimo) return 'bajo'
  return 'normal'
}
