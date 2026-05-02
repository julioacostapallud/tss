import { storage } from './storage'
import { authFakeApi } from './auth.fakeApi'
import { pagosFakeApi } from './pagos.fakeApi'
import { kioscoFakeApi } from './kiosco.fakeApi'
import { alumnosFakeApi } from './alumnos.fakeApi'
import { reportesFakeApi } from './reportes.fakeApi'
import { auditoriaFakeApi } from './auditoria.fakeApi'

export const fakeApi = {
  init: () => storage.init(),
  reset: () => storage.reset(),
  auth: authFakeApi,
  pagos: pagosFakeApi,
  kiosco: kioscoFakeApi,
  alumnos: alumnosFakeApi,
  reportes: reportesFakeApi,
  auditoria: auditoriaFakeApi,
}
