# Mapa de navegación — SquatGym UI

Protótipo front-end (`squatgym-ui`). Fuente: `src/app/routes.jsx`, `src/app/menuConfig.js`, enlaces y alertas en pantallas.

## Leyenda

| Símbolo / estilo | Significado |
|------------------|-------------|
| Línea continua `-->` | Navegación habitual (menú lateral, botón, enlace) |
| Línea punteada `-.->` | Redirección automática o acceso secundario |
| Línea con etiqueta `🔔` | Centro de alertas (campana del header) |
| Nodo `((Modal))` | Pantalla superpuesta **sin cambio de URL** |
| `[/ruta]` | Ruta en el navegador |

---

## Tabla: pantallas por rol

| Ruta | Título | Admin | Encargado | Secretaria | Alumno | Menú lateral |
|------|--------|:-----:|:---------:|:----------:|:------:|:------------:|
| `/` | Landing pública | — | — | — | — | — |
| `/login` | Iniciar sesión | ✓ | ✓ | ✓ | ✓ | — |
| `/recuperar-contrasena` | Recuperar contraseña | ✓ | ✓ | ✓ | ✓ | — |
| `/recuperar-contrasena/:token` | Restablecer contraseña | ✓ | ✓ | ✓ | ✓ | — |
| `/dashboard` | HOME | ✓ | ✓ | ✓ | ✓ | Inicio |
| `/pagos/reporte` | Reporte de cuotas | ✓ | ✓ | — | — | Cuotas y Cobros |
| `/pagos/promociones` | Planes y promociones | ✓ | — | — | — | Planes y Promociones |
| `/pagos/registrar` | Pagos de cuota | — | — | ✓ | — | Registro de Pagos |
| `/pagos/recibo/:id` | Recibo digital (página) | ✓ | ✓ | ✓ | ✓ | — |
| `/kiosco/ventas` | Ventas SquatShop | ✓ | ✓ | — | — | Ventas |
| `/kiosco/stock` | Stock por sucursal | ✓ | ✓ | ✓ | — | Stock / Consulta |
| `/kiosco/venta` | SquatShop ventas (caja) | — | — | ✓ | — | Ventas |
| `/auditoria` | Auditoría | ✓ | — | — | — | Auditoría |
| `/mi-cuenta/estado-cuenta` | Resumen de cuenta | — | — | — | ✓ | Estado de Cuenta |
| `/mi-cuenta/pagar` | — | — | — | — | ✓* | — |
| `/mi-cuenta/pagos` | — | — | — | — | ✓* | — |

\*Redirigen a `/mi-cuenta/estado-cuenta` (anclas `#pagar-desde-app` / `#historial-recibos`).

**Shell común (todos los autenticados):** logo → `/dashboard`; campana → rutas de alertas; cerrar sesión → `/` (sin sesión).

---

## 1. Acceso público y autenticación

```mermaid
flowchart TB
  subgraph publico["Sin sesión"]
    L["/ Landing"]
    LG["/login"]
    FP["/recuperar-contrasena"]
    RT["/recuperar-contrasena/:token"]
  end

  L -->|Ingresá al portal| LG
  L --> LG
  LG -->|Volver al inicio| L
  LG -->|Recuperar contraseña| FP
  FP --> RT
  RT -->|Contraseña actualizada| LG
  FP -->|Cancelar| LG

  LG -->|Login OK| D["/dashboard"]
  L -.->|Si ya hay sesión| D
  LG -.->|Si ya hay sesión| D
```

---

## 2. Administrador

```mermaid
flowchart TB
  D["/dashboard<br/>HOME Admin"]

  D -->|Menú| R["/pagos/reporte<br/>Reporte cuotas"]
  D -->|Menú| P["/pagos/promociones<br/>Planes y promos"]
  D -->|Menú| V["/kiosco/ventas<br/>Ventas SquatShop"]
  D -->|Menú| S["/kiosco/stock<br/>Stock"]
  D -->|Menú| A["/auditoria<br/>Auditoría"]

  D -->|Atajos dashboard| R
  D -->|Atajos dashboard| V
  D -->|Atajos dashboard| S
  D -->|Atajos dashboard| P

  D -.->|🔔 Stock crítico| S
  D -.->|🔔 Faltantes mostrador| S
  D -.->|🔔 Reposición en curso| S

  R -->|Modal ver recibo| MR(("Modal Recibo"))
  S -->|Menú ⋮| MS(("Modales Stock"))
  MS --> M1["Reposición"]
  MS --> M2["Pedidos en curso"]
  MS --> M3["Faltantes / incidencias"]
  M3 --> M4["Ajuste físico aprobación"]
  P --> MP(("Modal plan / producto"))

  V -->|Menú ⋮ fila| MV(("Modal detalle venta"))
```

---

## 3. Encargado de sucursal

```mermaid
flowchart TB
  D["/dashboard<br/>HOME Encargado"]

  D -->|Menú| R["/pagos/reporte<br/>Reporte cuotas"]
  D -->|Menú| V["/kiosco/ventas<br/>Ventas"]
  D -->|Menú| S["/kiosco/stock<br/>Stock"]

  D -->|Atajos dashboard| R
  D -->|Atajos dashboard| V
  D -->|Atajos dashboard| S
  D -->|Link stock irregular| S

  D -.->|🔔 Socios sin cobro| R
  D -.->|🔔 Stock irregular| S
  D -.->|🔔 Pedidos reposición| S
  D -.->|🔔 Faltantes informados| S

  R -->|Modal recibo| MR(("Modal Recibo"))
  S -->|Menú ⋮| MS(("Modales Stock"))
  MS --> M1["Solicitar reposición"]
  MS --> M2["Ver pedidos en curso"]
  MS --> M3["Ver faltantes mostrador"]
  V --> MV(("Modal detalle venta"))
```

---

## 4. Secretaria

```mermaid
flowchart TB
  D["/dashboard<br/>HOME Secretaria"]

  D -->|Menú| G["/pagos/registrar<br/>Pagos de cuota"]
  D -->|Menú| K["/kiosco/venta<br/>SquatShop + caja"]
  D -->|Menú| S["/kiosco/stock<br/>Consulta stock"]

  D -->|Atajos dashboard| G
  D -->|Atajos dashboard| K
  D -->|Atajos dashboard| S

  D -.->|🔔 Socios sin cobro| G
  D -.->|🔔 Pagos por conciliar| G
  D -.->|🔔 Stock bajo/agotado| S
  D -.->|🔔 Faltantes mostrador| S

  G -->|Tras registrar / Ver recibo| MR(("Modal Recibo"))
  G -->|Registrar pago| MREG(("Modal Registrar pago"))

  K --> MK(("Modales caja / venta"))
  MK --> MA["Abrir caja"]
  MK --> MC["Cerrar caja"]
  MK --> MCO["Comprobante apertura/cierre"]
  MK --> MCF["Confirmar venta"]
  MK --> MCR["Comprobante venta"]

  S -->|Menú ⋮| MS(("Modales Stock"))
  MS --> MF["Reportar faltante"]
  S -->|PDF planilla| S
```

---

## 5. Alumno / socio

```mermaid
flowchart TB
  D["/dashboard<br/>HOME Alumno"]

  D -->|Menú / CTA| E["/mi-cuenta/estado-cuenta<br/>Resumen de cuenta"]

  D -.->|🔔 Cuota vencida| PAY["/mi-cuenta/pagar"]
  D -.->|🔔 Pago en verificación| HIST["/mi-cuenta/pagos"]
  D -.->|🔔 Saldo pendiente| E

  PAY -.->|Redirect| E2["estado-cuenta#pagar"]
  HIST -.->|Redirect| E3["estado-cuenta#historial"]

  E -->|Pagar período| MPO(("Modal Pago online"))
  E -->|Ver recibo| MR(("Modal Recibo"))
  MPO -->|OK| MR
```

---

## 6. Reglas globales del router

```mermaid
flowchart LR
  REQ["Ruta protegida"] --> AUTH{¿Sesión?}
  AUTH -->|No| L["/"]
  AUTH -->|Sí| ROLE{¿Rol permitido?}
  ROLE -->|No| D["/dashboard"]
  ROLE -->|Sí| OK["Pantalla solicitada"]
  REQ -->|Ruta desconocida| D
```

---

## 7. Modales sin cambio de URL (resumen)

| Pantalla host | Modales |
|---------------|---------|
| `/kiosco/stock` | Pedidos en curso; solicitar reposición; reportar faltante; listado incidencias; ajuste físico (admin) |
| `/kiosco/venta` | Abrir caja; cerrar caja; comprobante caja; confirmar venta; comprobante venta |
| `/kiosco/ventas` | Detalle de venta |
| `/pagos/registrar` | Registrar pago; recibo digital |
| `/mi-cuenta/estado-cuenta` | Pago online; recibo digital |
| `/pagos/promociones` | Alta/edición plan; alta producto kiosco |
| `/pagos/recibo/:id` | Recibo a pantalla completa (mismo componente que el modal; `navigate(-1)` al cerrar) |

---

## Cómo ver los diagramas

- En **GitHub/GitLab**: este `.md` renderiza Mermaid en el visor del repo.
- En **VS Code/Cursor**: extensión “Markdown Preview Mermaid Support”.
- Exportar a PNG/PDF: [mermaid.live](https://mermaid.live) (pegar cada bloque `mermaid`).

---

*Generado para Diseño de Sistemas — TPI SquatGym 2026. Actualizar si cambian `routes.jsx` o `menuConfig.js`.*
