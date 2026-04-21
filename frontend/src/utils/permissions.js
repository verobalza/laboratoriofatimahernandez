export const MASTER_EMAIL = 'veronicabalza19@gmail.com'
export const ALL_PERMISSIONS = [
  'registro_pacientes',
  'pruebas',
  'examenes',
  'facturacion',
  'registro_financiero',
  'inventario',
  'roles'
]

export const PERMISSION_LABEL_BY_KEY = {
  registro_pacientes: 'Registro de Pacientes',
  pruebas: 'Pruebas',
  examenes: 'Exámenes',
  facturacion: 'Facturación',
  registro_financiero: 'Registro Financiero',
  inventario: 'Inventario',
  roles: 'Administración de Roles'
}

export const PERMISSION_KEY_BY_LABEL = {
  ...Object.entries(PERMISSION_LABEL_BY_KEY).reduce(
    (acc, [key, label]) => ({ ...acc, [label]: key }),
    {}
  ),
  'Registro pacientes': 'registro_pacientes',
  'Registro financiero': 'registro_financiero'
}

export function getStoredUser() {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (error) {
    return null
  }
}

export function isMasterUser(user) {
  return Boolean(user?.email?.toString().toLowerCase() === MASTER_EMAIL)
}

export function buildPermissionsMap(raw = {}) {
  return ALL_PERMISSIONS.reduce((acc, permiso) => {
    acc[permiso] = Boolean(raw?.[permiso])
    return acc
  }, {})
}

export function getStoredPermissions() {
  const user = getStoredUser()
  if (isMasterUser(user)) {
    return ALL_PERMISSIONS.reduce((acc, permiso) => {
      acc[permiso] = true
      return acc
    }, {})
  }

  const raw = localStorage.getItem('user_permissions')
  if (!raw) return buildPermissionsMap()

  try {
    const parsed = JSON.parse(raw)
    return buildPermissionsMap(parsed)
  } catch (error) {
    return buildPermissionsMap()
  }
}

export function saveStoredPermissions(permissions) {
  const normalized = buildPermissionsMap(permissions)
  localStorage.setItem('user_permissions', JSON.stringify(normalized))
}

export function getPermissionKeyFromLabel(label) {
  return PERMISSION_KEY_BY_LABEL[label] || null
}
