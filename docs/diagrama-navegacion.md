# Diagramas de navegación — SquatGym UI

**Leyenda:** rectángulos = pantallas, menú, contenido o modales · flecha = acción del usuario · `Menú · …` = ítem del menú lateral.

**Cómo leer sin solapamientos:** cada rol tiene **varios diagramas** (pantallas + menú aparte). En [mermaid.live](https://mermaid.live) pegá un bloque, usá **curva step** y exportá a PNG con zoom **150–200 %**.

---

## P — Acceso público

```mermaid
%%{init: {'flowchart': {'curve': 'step', 'nodeSpacing': 50, 'rankSpacing': 70, 'padding': 16}}}%%
flowchart TD
  P01["P-01<br/>Landing"]
  P02["P-02<br/>Iniciar sesión"]
  P03["P-03<br/>Recuperar contraseña"]
  P04["P-04<br/>Restablecer contraseña"]
  P05["P-05<br/>Inicio HOME del rol"]

  P01 -->|Click Ingresar al portal| P02
  P02 -->|Login correcto| P05
  P02 -->|Click Recuperar contraseña| P03
  P03 -->|Continuar| P04
  P04 -->|Contraseña actualizada| P02
  P01 -.->|Ya hay sesión| P05
  P02 -.->|Ya hay sesión| P05
```

---

## A — Administrador

### A · Pantallas 1–3 (Inicio, Cuotas, Planes)

```mermaid
%%{init: {'flowchart': {'curve': 'step', 'nodeSpacing': 55, 'rankSpacing': 75, 'padding': 20}}}%%
flowchart LR
  CAMP["🔔 Campana alertas"]
  HDR["Header · logo"]
  HDR -->|Click logo| A01M

  subgraph COL1[" "]
    direction TB
    subgraph A01["A-01 · Inicio HOME"]
      direction TB
      A01M["Menú lateral<br/><i>ver diagrama Menú A</i>"]
      A01C["Contenido · panel institucional"]
      A01M --- A01C
    end
    subgraph A02["A-02 · Reporte de cuotas"]
      direction TB
      A02M["Menú lateral<br/><i>ver diagrama Menú A</i>"]
      A02C["Contenido · reporte y filtros"]
      A02M --- A02C
      A02C -->|Click Ver recibo| AM1["A-M1 · Recibo digital"]
      A02C -->|Tras registrar pago OK| AM1
    end
  end

  subgraph COL2[" "]
    direction TB
    subgraph A03["A-03 · Planes y promociones"]
      direction TB
      A03M["Menú lateral<br/><i>ver diagrama Menú A</i>"]
      A03C["Contenido · cuotas / promos / kiosco"]
      A03M --- A03C
      A03C -->|Click Nuevo plan| AM7["A-M7 · Nuevo plan"]
      A03C -->|Click Nuevo producto| AM8["A-M8 · Nuevo producto"]
      A03C -->|Click Nueva promoción| AM9["A-M9 · Nueva promoción"]
      A03C -->|Click Editar promoción| AM9
    end
  end

  A01C -->|Atajo Reporte cuotas| A02M
  A01C -->|Atajo Precios y promos| A03M
  A01C -->|Enlace Lista precios kiosco| A03M
  A01C -.->|Atajo Ventas| A04ref["A-04 Ventas<br/><i>ver A · Pantallas 4–6</i>"]
  A01C -.->|Atajo Stock| A05ref["A-05 Stock<br/><i>ver A · Pantallas 4–6</i>"]

  CAMP -.->|Stock crítico / Faltantes / Reposición| A05ref
```

### A · Pantallas 4–6 (Ventas, Stock, Auditoría)

```mermaid
%%{init: {'flowchart': {'curve': 'step', 'nodeSpacing': 55, 'rankSpacing': 75, 'padding': 20}}}%%
flowchart LR
  subgraph COL1[" "]
    direction TB
    subgraph A04["A-04 · Ventas SquatShop"]
      direction TB
      A04M["Menú lateral<br/><i>ver diagrama Menú A</i>"]
      A04C["Contenido · ventas por sede"]
      A04M --- A04C
      A04C -->|Menú ⋮ Detalle| AM2["A-M2 · Detalle de venta"]
    end
    subgraph A05["A-05 · Stock y pedidos"]
      direction TB
      A05M["Menú lateral<br/><i>ver diagrama Menú A</i>"]
      A05C["Contenido · tabla stock"]
      A05M --- A05C
      A05C -->|Menú ⋮ Solicitar reposición| AM3["A-M3 · Solicitar reposición"]
      A05C -->|Menú ⋮ Ver pedidos en curso| AM4["A-M4 · Pedidos en curso"]
      A05C -->|Menú ⋮ Faltantes mostrador| AM5["A-M5 · Lista incidencias"]
      A05C -->|Aprobar ajuste sugerido| AM6["A-M6 · Ajuste físico stock"]
      AM5 -->|Click Aprobar ajuste| AM6
    end
  end

  subgraph COL2[" "]
    direction TB
    subgraph A06["A-06 · Auditoría"]
      direction TB
      A06M["Menú lateral<br/><i>ver diagrama Menú A</i>"]
      A06C["Contenido · log auditoría"]
      A06M --- A06C
    end
  end
```

### A · Menú lateral (desde cualquier pantalla A-01 … A-06)

*El bloque «Menú lateral» es idéntico en todas las pantallas; desde cualquiera podés ir a las demás con los ítems listados.*

```mermaid
%%{init: {'flowchart': {'curve': 'step', 'nodeSpacing': 70, 'rankSpacing': 90, 'padding': 24}}}%%
flowchart TB
  HUB["Menú lateral<br/><i>presente en A-01 … A-06</i>"]

  subgraph FILA1[" "]
    direction LR
    n01["A-01<br/>Inicio HOME"]
    n02["A-02<br/>Reporte cuotas"]
    n03["A-03<br/>Planes y promos"]
  end

  subgraph FILA2[" "]
    direction LR
    n04["A-04<br/>Ventas SquatShop"]
    n05["A-05<br/>Stock y pedidos"]
    n06["A-06<br/>Auditoría"]
  end

  HUB -->|Menú · Inicio| n01
  HUB -->|Menú · Cuotas y Cobros| n02
  HUB -->|Menú · Planes y Promociones| n03
  HUB -->|Menú · Ventas| n04
  HUB -->|Menú · Stock y Pedidos| n05
  HUB -->|Menú · Auditoría| n06

  n01 ~~~ n02 ~~~ n03
  n04 ~~~ n05 ~~~ n06
```

*Líneas gruesas `~~~`: pantallas del mismo rol; el menú conecta **cualquiera → cualquiera** (no hace falta volver a A-01).*

---

## E — Encargado

### E · Pantallas y modales

```mermaid
%%{init: {'flowchart': {'curve': 'step', 'nodeSpacing': 55, 'rankSpacing': 75, 'padding': 20}}}%%
flowchart LR
  CAMP["🔔 Campana alertas"]
  HDR["Header · logo"]
  HDR -->|Click logo| E01M

  subgraph COL1[" "]
    direction TB
    subgraph E01["E-01 · Inicio HOME"]
      direction TB
      E01M["Menú lateral<br/><i>ver diagrama Menú E</i>"]
      E01C["Contenido · panel sede"]
      E01M --- E01C
    end
    subgraph E02["E-02 · Reporte de cuotas"]
      direction TB
      E02M["Menú lateral<br/><i>ver diagrama Menú E</i>"]
      E02C["Contenido · reporte sede"]
      E02M --- E02C
      E02C -->|Click Ver recibo| EM1["E-M1 · Recibo digital"]
    end
  end

  subgraph COL2[" "]
    direction TB
    subgraph E03["E-03 · Ventas SquatShop"]
      direction TB
      E03M["Menú lateral<br/><i>ver diagrama Menú E</i>"]
      E03C["Contenido · listado ventas"]
      E03M --- E03C
      E03C -->|Menú ⋮ Detalle| EM2["E-M2 · Detalle de venta"]
    end
    subgraph E04["E-04 · Stock y pedidos"]
      direction TB
      E04M["Menú lateral<br/><i>ver diagrama Menú E</i>"]
      E04C["Contenido · tabla stock"]
      E04M --- E04C
      E04C -->|Menú ⋮ Solicitar reposición| EM3["E-M3 · Solicitar reposición"]
      E04C -->|Menú ⋮ Ver pedidos en curso| EM4["E-M4 · Pedidos en curso"]
      E04C -->|Menú ⋮ Faltantes mostrador| EM5["E-M5 · Ver incidencias"]
    end
  end

  E01C -->|Atajo Stock| E04M
  E01C -->|Atajo Ventas| E03M
  E01C -->|Atajo Pagos por sede| E02M
  E01C -->|Enlace Gestionar stock| E04M

  CAMP -->|Socios sin cobro| E02M
  CAMP -->|Stock irregular| E04M
  CAMP -->|Pedidos reposición| E04M
  CAMP -->|Faltantes informados| E04M
```

### E · Menú lateral (desde cualquier pantalla E-01 … E-04)

```mermaid
%%{init: {'flowchart': {'curve': 'step', 'nodeSpacing': 70, 'rankSpacing': 90, 'padding': 24}}}%%
flowchart TB
  HUB["Menú lateral<br/><i>presente en E-01 … E-04</i>"]

  subgraph FILA[" "]
    direction LR
    e01["E-01<br/>Inicio HOME"]
    e02["E-02<br/>Reporte cuotas"]
    e03["E-03<br/>Ventas"]
    e04["E-04<br/>Stock y pedidos"]
  end

  HUB -->|Menú · Inicio| e01
  HUB -->|Menú · Cuotas y Cobros| e02
  HUB -->|Menú · Ventas| e03
  HUB -->|Menú · Stock y Pedidos| e04

  e01 ~~~ e02 ~~~ e03 ~~~ e04
```

---

## S — Secretaria

### S · Pantallas y modales

```mermaid
%%{init: {'flowchart': {'curve': 'step', 'nodeSpacing': 55, 'rankSpacing': 75, 'padding': 20}}}%%
flowchart LR
  CAMP["🔔 Campana alertas"]
  HDR["Header · logo"]
  HDR -->|Click logo| S01M

  subgraph COL1[" "]
    direction TB
    subgraph S01["S-01 · Inicio HOME"]
      direction TB
      S01M["Menú lateral<br/><i>ver diagrama Menú S</i>"]
      S01C["Contenido · operaciones del día"]
      S01M --- S01C
    end
    subgraph S02["S-02 · Registro de pagos"]
      direction TB
      S02M["Menú lateral<br/><i>ver diagrama Menú S</i>"]
      S02C["Contenido · cobro de cuotas"]
      S02M --- S02C
      S02C -->|Click Registrar pago| SM1["S-M1 · Registrar pago"]
      S02C -->|Click Ver recibo| SM2["S-M2 · Recibo digital"]
      SM1 -->|Pago OK| SM2
    end
  end

  subgraph COL2[" "]
    direction TB
    subgraph S03["S-03 · SquatShop y caja"]
      direction TB
      S03M["Menú lateral<br/><i>ver diagrama Menú S</i>"]
      S03C["Contenido · venta + caja"]
      S03M --- S03C
      S03C -->|Click Abrir caja| SM3a["S-M3a · Apertura caja"]
      S03C -->|Click Cerrar caja| SM3b["S-M3b · Cierre caja"]
      S03C -->|Click Registrar venta| SM3c["S-M3c · Confirmar venta"]
      SM3a -->|Confirmar| SM3d["S-M3d · Comprobante caja"]
      SM3b -->|Confirmar cierre| SM3d
      SM3c -->|Venta OK| SM3e["S-M3e · Comprobante venta"]
    end
    subgraph S04["S-04 · Consulta de stock"]
      direction TB
      S04M["Menú lateral<br/><i>ver diagrama Menú S</i>"]
      S04C["Contenido · tabla stock"]
      S04M --- S04C
      S04C -->|Click Descargar PDF| S04C
      S04C -->|Menú ⋮ Reportar faltante| SM4["S-M4 · Reportar faltante"]
    end
  end

  S01C -->|Atajo Pagos| S02M
  S01C -->|Atajo Ventas| S03M
  S01C -->|Atajo Stock| S04M
  S01C -->|Enlace Ir a pagos| S02M

  CAMP -->|Socios sin cobro| S02M
  CAMP -->|Pagos por conciliar| S02M
  CAMP -->|Stock bajo| S04M
  CAMP -->|Faltantes mostrador| S04M
```

### S · Menú lateral (desde cualquier pantalla S-01 … S-04)

```mermaid
%%{init: {'flowchart': {'curve': 'step', 'nodeSpacing': 70, 'rankSpacing': 90, 'padding': 24}}}%%
flowchart TB
  HUB["Menú lateral<br/><i>presente en S-01 … S-04</i>"]

  subgraph FILA[" "]
    direction LR
    s01["S-01<br/>Inicio HOME"]
    s02["S-02<br/>Registro pagos"]
    s03["S-03<br/>SquatShop y caja"]
    s04["S-04<br/>Consulta stock"]
  end

  HUB -->|Menú · Inicio| s01
  HUB -->|Menú · Registro de Pagos| s02
  HUB -->|Menú · Ventas| s03
  HUB -->|Menú · Consulta de Stock| s04

  s01 ~~~ s02 ~~~ s03 ~~~ s04
```

---

## L — Alumno

### L · Pantallas y modales

```mermaid
%%{init: {'flowchart': {'curve': 'step', 'nodeSpacing': 55, 'rankSpacing': 75, 'padding': 20}}}%%
flowchart LR
  CAMP["🔔 Campana alertas"]
  HDR["Header · logo"]
  HDR -->|Click logo| L01M

  subgraph COL1[" "]
    direction TB
    subgraph L01["L-01 · Inicio HOME"]
      direction TB
      L01M["Menú lateral<br/><i>ver diagrama Menú L</i>"]
      L01C["Contenido · resumen membresía"]
      L01M --- L01C
    end
  end

  subgraph COL2[" "]
    direction TB
    subgraph L02["L-02 · Resumen de cuenta"]
      direction TB
      L02M["Menú lateral<br/><i>ver diagrama Menú L</i>"]
      L02C["Contenido · períodos y pagos"]
      L02M --- L02C
      L02C -->|Click Pagar período| LM1["L-M1 · Pago online"]
      L02C -->|Click Ver recibo| LM2["L-M2 · Recibo digital"]
      LM1 -->|Pago OK| LM2
    end
  end

  L01C -->|Click Ir a mi cuenta| L02M

  CAMP -->|Cuota vencida| L02M
  CAMP -->|Pago en verificación| L02M
  CAMP -->|Saldo pendiente| L02M
```

### L · Menú lateral (desde cualquier pantalla L-01 … L-02)

```mermaid
%%{init: {'flowchart': {'curve': 'step', 'nodeSpacing': 80, 'rankSpacing': 100, 'padding': 24}}}%%
flowchart LR
  l01["L-01<br/>Inicio HOME"]
  l02["L-02<br/>Estado de cuenta"]

  l01 -->|Menú · Estado de Cuenta| l02
  l02 -->|Menú · Inicio| l01
```

---

## Índice numérico rápido

| Rol | Pantallas | Modales |
|-----|-----------|---------|
| P | P-01 … P-05 | — |
| A | A-01 … A-06 | A-M1 … A-M9 |
| E | E-01 … E-04 | E-M1 … E-M5 |
| S | S-01 … S-04 | S-M1 … S-M4, S-M3a…e |
| L | L-01 … L-02 | L-M1 … L-M2 |

---

*Exportar: [mermaid.live](https://mermaid.live) · Curva **step** · Zoom **150–200 %** al exportar PNG.*
