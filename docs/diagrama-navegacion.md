# Mapa de navegación — SquatGym UI

Protótipo front-end. Cada rol tiene su **numeración propia** (no se comparte entre roles).

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| `──►` en diagrama | Menú lateral, botón o enlace en pantalla |
| `┄┄►` en diagrama | Redirección automática |
| `🔔` | Acceso desde centro de alertas (header) |
| **M-xx** | Modal (misma pantalla, sin cambio de vista principal) |

**Diagramas:** líneas rectas (`curve: linear`) y un solo nivel desde **Inicio** para evitar cruces.

---

## Catálogo — Acceso público (P)

| Nº | Pantalla |
|----|----------|
| P-01 | Landing SquatGym |
| P-02 | Iniciar sesión |
| P-03 | Recuperar contraseña |
| P-04 | Restablecer contraseña |
| P-05 | Inicio HOME *(tras login, cualquier rol)* |

---

## Catálogo — Administrador (A)

| Nº | Pantalla | Menú lateral |
|----|----------|:------------:|
| A-01 | Inicio HOME | ✓ Inicio |
| A-02 | Reporte de cuotas por sucursal | ✓ Cuotas y Cobros |
| A-03 | Planes, cuotas y promociones | ✓ Planes y Promociones |
| A-04 | Ventas SquatShop por sucursal | ✓ Ventas |
| A-05 | Stock y pedidos por sucursal | ✓ Stock y Pedidos |
| A-06 | Auditoría del sistema | ✓ Auditoría |
| A-M1 | Recibo digital *(modal)* | — |
| A-M2 | Detalle de venta *(modal)* | — |
| A-M3 | Gestión stock: reposición, pedidos, faltantes, ajuste *(modales)* | — |
| A-M4 | Alta/edición plan o producto kiosco *(modal)* | — |

**Alertas 🔔 desde A-01:** Stock crítico → A-05 · Faltantes mostrador → A-05 · Reposición en curso → A-05

---

## Catálogo — Encargado (E)

| Nº | Pantalla | Menú lateral |
|----|----------|:------------:|
| E-01 | Inicio HOME | ✓ Inicio |
| E-02 | Reporte de cuotas por sucursal | ✓ Cuotas y Cobros |
| E-03 | Ventas SquatShop por sucursal | ✓ Ventas |
| E-04 | Stock y pedidos por sucursal | ✓ Stock y Pedidos |
| E-M1 | Recibo digital *(modal)* | — |
| E-M2 | Detalle de venta *(modal)* | — |
| E-M3 | Gestión stock: reposición, pedidos, ver faltantes *(modales)* | — |

**Alertas 🔔 desde E-01:** Socios sin cobro → E-02 · Stock irregular → E-04 · Pedidos reposición → E-04 · Faltantes informados → E-04

---

## Catálogo — Secretaria (S)

| Nº | Pantalla | Menú lateral |
|----|----------|:------------:|
| S-01 | Inicio HOME | ✓ Inicio |
| S-02 | Registro de pagos de cuota | ✓ Registro de Pagos |
| S-03 | SquatShop — ventas y caja | ✓ Ventas |
| S-04 | Consulta de stock | ✓ Consulta de Stock |
| S-M1 | Registrar pago *(modal)* | — |
| S-M2 | Recibo digital *(modal)* | — |
| S-M3 | Caja: abrir, cerrar, comprobantes, confirmar venta *(modales)* | — |
| S-M4 | Stock: reportar faltante *(modal)* | — |

**Alertas 🔔 desde S-01:** Socios sin cobro → S-02 · Pagos por conciliar → S-02 · Stock bajo/agotado → S-04 · Faltantes mostrador → S-04

**En S-04:** exportar planilla PDF (misma pantalla, sin nueva numeración).

---

## Catálogo — Alumno (L)

| Nº | Pantalla | Menú lateral |
|----|----------|:------------:|
| L-01 | Inicio HOME | ✓ Inicio |
| L-02 | Resumen de cuenta y pagos | ✓ Estado de Cuenta |
| L-M1 | Pago online *(modal)* | — |
| L-M2 | Recibo digital *(modal)* | — |

**Alertas 🔔 desde L-01:** Cuota vencida → L-02 (sección pagar) · Pago en verificación → L-02 (historial) · Saldo pendiente → L-02

*(Las entradas “Pagar cuota” y “Recibos” del menú antiguo redirigen al resumen L-02.)*

---

## 1. Acceso público (P-01 a P-05)

```mermaid
%%{init: {'flowchart': {'curve': 'linear', 'nodeSpacing': 40, 'rankSpacing': 55}}}%%
flowchart TD
  P01["P-01 · Landing"]
  P02["P-02 · Iniciar sesión"]
  P03["P-03 · Recuperar contraseña"]
  P04["P-04 · Restablecer contraseña"]
  P05["P-05 · Inicio HOME"]

  P01 --> P02
  P02 --> P05
  P02 --> P03
  P03 --> P04
  P04 --> P02
  P01 -.-> P05
  P02 -.-> P05
```

---

## 2. Administrador (A-01 a A-06)

```mermaid
%%{init: {'flowchart': {'curve': 'linear', 'nodeSpacing': 35, 'rankSpacing': 50}}}%%
flowchart TD
  A01["A-01 · Inicio HOME"]

  A01 --> A02["A-02 · Reporte de cuotas"]
  A01 --> A03["A-03 · Planes y promociones"]
  A01 --> A04["A-04 · Ventas SquatShop"]
  A01 --> A05["A-05 · Stock y pedidos"]
  A01 --> A06["A-06 · Auditoría"]

  A02 --> AM1["A-M1 · Recibo digital"]
  A04 --> AM2["A-M2 · Detalle de venta"]
  A05 --> AM3["A-M3 · Modales de stock"]
  A03 --> AM4["A-M4 · Plan o producto"]
```

*Atajos en A-01 y alertas 🔔 apuntan a las mismas pantallas A-02 … A-06 (ver catálogo).*

---

## 3. Encargado (E-01 a E-04)

```mermaid
%%{init: {'flowchart': {'curve': 'linear', 'nodeSpacing': 35, 'rankSpacing': 50}}}%%
flowchart TD
  E01["E-01 · Inicio HOME"]

  E01 --> E02["E-02 · Reporte de cuotas"]
  E01 --> E03["E-03 · Ventas SquatShop"]
  E01 --> E04["E-04 · Stock y pedidos"]

  E02 --> EM1["E-M1 · Recibo digital"]
  E03 --> EM2["E-M2 · Detalle de venta"]
  E04 --> EM3["E-M3 · Modales de stock"]
```

---

## 4. Secretaria (S-01 a S-04)

```mermaid
%%{init: {'flowchart': {'curve': 'linear', 'nodeSpacing': 35, 'rankSpacing': 50}}}%%
flowchart TD
  S01["S-01 · Inicio HOME"]

  S01 --> S02["S-02 · Registro de pagos"]
  S01 --> S03["S-03 · SquatShop y caja"]
  S01 --> S04["S-04 · Consulta de stock"]

  S02 --> SM1["S-M1 · Registrar pago"]
  S02 --> SM2["S-M2 · Recibo digital"]
  S03 --> SM3["S-M3 · Modales de caja y venta"]
  S04 --> SM4["S-M4 · Reportar faltante"]
```

---

## 5. Alumno (L-01 a L-02)

```mermaid
%%{init: {'flowchart': {'curve': 'linear', 'nodeSpacing': 40, 'rankSpacing': 55}}}%%
flowchart TD
  L01["L-01 · Inicio HOME"]
  L02["L-02 · Resumen de cuenta"]

  L01 --> L02
  L02 --> LM1["L-M1 · Pago online"]
  L02 --> LM2["L-M2 · Recibo digital"]
  LM1 --> LM2
```

*Alertas 🔔 desde L-01 llevan a L-02 (pestaña o sección según el tipo de aviso).*

---

## 6. Reglas de acceso (todas las pantallas internas)

```mermaid
%%{init: {'flowchart': {'curve': 'linear', 'nodeSpacing': 30, 'rankSpacing': 45}}}%%
flowchart TD
  IN["Solicitud de pantalla"]
  SES{"¿Hay sesión?"}
  ROL{"¿Rol autorizado?"}
  OK["Muestra la pantalla"]
  P01b["P-01 · Landing"]
  A01b["P-05 / A-01 / E-01 / S-01 / L-01 · Inicio HOME"]

  IN --> SES
  SES -->|No| P01b
  SES -->|Sí| ROL
  ROL -->|No| A01b
  ROL -->|Sí| OK
```

---

## Detalle de modales (referencia)

| Host | Modales |
|------|---------|
| A-05 / E-04 / S-04 · Stock | Pedidos en curso · Solicitar reposición · Reportar faltante · Incidencias · Ajuste físico *(solo admin)* |
| S-03 · SquatShop y caja | Abrir caja · Cerrar caja · Comprobante caja · Confirmar venta · Comprobante venta |
| A-04 / E-03 · Ventas | Detalle de venta |
| S-02 · Registro de pagos | Registrar pago · Recibo digital |
| L-02 · Resumen de cuenta | Pago online · Recibo digital |
| A-03 · Promociones | Plan · Producto kiosco |

---

## Cómo ver y exportar

- **Preview:** VS Code/Cursor con soporte Mermaid, o GitHub/GitLab.
- **PNG/PDF:** [mermaid.live](https://mermaid.live) — pegar un bloque `mermaid` a la vez.
- Si aún se ven curvas: en mermaid.live, *Configuration* → *Flowchart* → **Curve** = `linear` o `step`.

---

*Diseño de Sistemas — TPI SquatGym 2026. Numeración y nombres alineados a `routes.jsx` y `menuConfig.js`.*
