# Modelo de datos y dominio

## Diagrama MER (núcleo)

Fuente PlantUML: [`diagramas/mer-entidades.puml`](./diagramas/mer-entidades.puml).

## Evolución: `plan_rules` → `rule_assignments`

Existieron migraciones sobre tabla `plan_rules`; el esquema actual usa **`rule_assignments`** (polimórfico `ruleable` → `Product` o `Plan`). Las relaciones plan–regla–canal se gestionan con ese modelo y la API v2 de assignments. No busques rake `create_plan_rules` en el código actual: la asignación se hace por **API** o seeds/tareas internas.

## Modelos ActiveRecord (`app/models/`)

| Modelo | Tabla / notas |
|--------|----------------|
| `ApplicationRecord` | Base |
| `Product` | `products` |
| `Plan` | `plans` |
| `Rule` | `rules` |
| `RuleAssignment` | `rule_assignments` |
| `DistributorChannel` | `distributor_channels` |
| `Transaction` | `transactions` — enums `type`, `process`, `status`, `payment_method` |
| `TransactionCodeSequence` | `transaction_code_sequences` |
| `PromotionalCode` | `promotional_codes` |
| `Category` | `categories` |
| `SalesPromoterIdentifiers` | soporte a promotores (validación) |
| `InsuredCash::Plan`, `InsuredCash::PlanVersion` | planes Insured Cash + versiones |
| Brokers | `Brokers::ProcessManager`, `TransitionManager`, `PermittedProcedures` (no son tablas) |

## `Transaction` — enums (código fuente)

**`type`:** `create_plan`, `create_policy`, `create_quote`, `cancel_policy`, `create_validation`.

**`status`:** `pending`, `rejected`, `approved`, `canceled` (transiciones en `permitted_transitions`).

**`payment_method`:** `credit`, `epayco`, `promotional_code`, `yape`, `debit`, `mi_banco`, `bcp`.

**`process`:** lista completa en `Transaction::TRANSACTION_PROCESSES` dentro de `app/models/transaction.rb` (incluye `vehicle_soat`, `protected_card`, `life_insurance`, `insurances`, `cellphone`, `pymes`, `fraud_consultation`, `register_reinsurer`, `dana_certificate`, etc.). **No duplicar aquí:** al añadir un valor, actualizar el modelo y esta doc solo si el negocio lo requiere.

## `Rule`

- `process`: mismos símbolos que `Transaction` (enum compartido).
- `api_type`: `tenancy`, `quote`, `issue`, `cancellation`, `quote_first_version`, `issue_first_version`.
- JSONB: `json_schema_payload`, `api_settings`, `request_parameters`, `response_parameters`.

## Validación destacada

- `Transaction`: transiciones de estado; `TransitionPayloadValidator` en procesos marcados en `allow_transition_process?`.
- `Rule`: `RuleSchemasValidator`, unicidad por `process` + `api_type` + `priority`.

## Siguiente lectura

- [API v1](./04-api-version-1.md) / [API v2](./05-api-version-2.md)
- [Integración proveedores](./09-integracion-proveedores.md)
