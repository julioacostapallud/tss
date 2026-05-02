export const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-AR')
}

export const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}
