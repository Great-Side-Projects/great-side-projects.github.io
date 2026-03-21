# Mapa del repositorio (inventario)

Revisión orientativa del árbol **provider-service** para localizar código. Los conteos pueden variar con el tiempo.

## Raíz relevante

| Ruta | Contenido |
|------|-----------|
| `app/` | Código de aplicación Rails |
| `bin/` | `rails`, `setup`, etc. |
| `config/` | Rutas, entornos, Apartment, RabbitMQ, Sneakers, inicializadores |
| `db/` | `schema.rb`, `migrate/` |
| `docs/` | Documentación interna (esta guía en `docs/es/`, flujos en `docs/*.md`) |
| `lib/` | `providers/` (integraciones HTTP), tasks |
| `spec/` | RSpec (requests, services, workers, models) |
| `swagger/` | OpenAPI v1 (`swagger/v1/swagger.yaml` + schemas JSON) |

## `app/controllers`

- `application_controller.rb` — API base, Pagy, zona horaria Lima.
- `concerns/error_handler.rb` — rescates globales.
- `v1/` — 9 archivos: transacciones, transiciones, tenencias, reportes, asistencias, documentos, insured cash, códigos promocionales, promotores.
- `v2/` — productos integración, reglas, assignments, quotes, policies, cancellations.

**Nota:** `config/routes.rb` declara `protected_card_issuances`; no hay controlador homónimo en `app/controllers/v1` en la revisión del repo (posible deuda técnica o ruta legacy).

## `app/models`

ActiveRecord: `transaction`, `product`, `plan`, `rule`, `rule_assignment`, `distributor_channel`, `promotional_code`, `transaction_code_sequence`, `category`, `sales_promoter_identifiers`, `insured_cash/plan*`, concerns reutilizables.

Brokers (no AR): `ProcessManager`, `TransitionManager`, `PermittedProcedures`, `BaseManager`.

## `app/services` (~150+ archivos)

Namespaces principales: `v2/`, `transactions/`, `pacifico_seguros/` (SOAT, vida, tarjeta, celular, pymes, PGA, tenencias, mocks), `pacifico_salud/`, `policy_tenancies/`, `recurring_charge/`, `yape/`, `yape_seguros/`, `asissprex/`, `mi_banco/`, `configurable_process/`, `assistances/`, `reports/`, `promotional_codes/`, `schemas/`, `monokera_core/`, `concerns/`.

## `app/workers`

18 clases worker (incl. módulo `RecurringCharge::`), concerns en `app/workers/concerns/`.

## `lib/providers` (~50 archivos)

- `request_broker.rb`, `permitted_processes.rb`, `client_base.rb`
- `pacifico_seguros/`, `pacifico_salud/` — clientes v1, autenticación por flujo
- `v2/` — clientes y `api/request_builder`, diccionarios, headers
- `assurant/`, `insurama/`, `asissprex/`, `tsana/`, `yape_seguros/`

## `spec/`

- `requests/v1`, `requests/v2` — contratos HTTP
- `services/`, `workers/`, `models/`, `serializers/`, `validators/`

## Comandos útiles

```bash
bin/rspec
bin/rails routes   # requiere BD/config según entorno
```

## Siguiente lectura

- [README índice](./README.md)
