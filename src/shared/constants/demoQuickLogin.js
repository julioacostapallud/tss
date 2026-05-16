import { ROLES } from './roles'

/** Texto visible junto al nombre en el login demo. */
export const ROLE_DISPLAY = {
  [ROLES.ADMINISTRADOR]: 'Administrador',
  [ROLES.ENCARGADO]: 'Encargado',
  [ROLES.SECRETARIA]: 'Secretaria',
  [ROLES.ALUMNO]: 'Alumno',
}

/**
 * Credenciales de prueba por rol (1 admin, hasta 2 encargados / secretarias / alumnos).
 * Debe coincidir con `fakeApi/seed.js`.
 */
export const DEMO_QUICK_LOGIN_EMAILS_ORDERED = [
  'admin@squatgym.com',
  'encargado.centro@squatgym.com',
  'encargado.norte@squatgym.com',
  'secretaria.centro@squatgym.com',
  'secretaria.norte@squatgym.com',
  'martin.rios.001@squatgym.com',
  'camila.benitez.002@squatgym.com',
]
