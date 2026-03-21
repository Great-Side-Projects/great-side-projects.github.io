# Modelo de datos y dominio

## Diagrama MER (núcleo)

La fuente editable está en [`diagramas/mer-entidades.puml`](./diagramas/mer-entidades.puml). Incluye tablas nucleares de negocio; otras tablas (p. ej. `insured_cash_plans`, `categories`, `flipper_*`) existen en `db/schema.rb` para funcionalidades concretas.

## Entidades principales

### Product (`products`)

- Identifica un producto de seguro en Monokera: `name`, `code`, `uid` (generado; `code` y `uid` son de solo lectura en modelo).
- `has_many :plans`, `has_many :rule_assignments` (como `ruleable` polimórfico).

### Plan (`plans`)

- Pertenece a un `Product`: `code`, `name`, `core` (integrator / mirror / core), `payment_frequency` (monthly / yearly), `premium`.
- Unicidad de `code` y `name` **por producto**.

### Rule (`rules`)

- Define **cómo** llamar a la API del asegurador: `api_settings`, `request_parameters`, `response_parameters`, `json_schema_payload`.
- `process`: alineado con `Transaction::TRANSACTION_PROCESSES` (mismos valores enteros).
- `api_type`: `tenancy`, `quote`, `issue`, `cancellation`, y variantes `quote_first_version` / `issue_first_version` para convivencia de versiones en el mismo proceso de negocio.
- `priority` + unicidad lógica `(process, api_type, priority)` para ordenar reglas competidoras.

### DistributorChannel (`distributor_channels`)

- Canal de distribución (`name`, `code`). Se crea habitualmente con rake (ver [Tareas](./08-tareas-operacion.md)).

### RuleAssignment (`rule_assignments`)

- Relación polimórfica `ruleable` → `Product` o `Plan`, más `rule` y opcionalmente `distributor_channel`.
- `custom_settings` (JSONB) permite **sobrescribir** por canal/asignación fragmentos de `json_schema_payload`, `api_settings`, `request_parameters`, `response_parameters` sin duplicar la regla entera.

Diagrama conceptual: [`diagramas/reglas-plan-canal.puml`](./diagramas/reglas-plan-canal.puml).

### Transaction (`transactions`)

Registro de una operación de integración con el proveedor.

- **`type`** (`Transaction::TRANSACTION_TYPES`): `create_plan`, `create_policy`, `create_quote`, `cancel_policy`, `create_validation`.
- **`process`**: dominio funcional (SOAT, tarjeta protegida, vida, salud, celular, etc.). Lista autoritativa en código:

  Ver `TRANSACTION_PROCESSES` en `app/models/transaction.rb` (incluye entre otros: `vehicle_soat`, `protected_card`, `life_insurance`, `insurances`, `pymes`, `fraud_consultation`, `register_reinsurer`, …).

- **`status`**: `pending`, `rejected`, `approved`, `canceled` con **máquina de estados** (`permitted_transitions` en el modelo).
- **`protocol_number`**: identificador único de negocio; se autogenera si falta.
- **`payment_method`**: requerido en actualización; valores en `TRANSACTION_PAYMENT_METHOD`.
- **JSONB**: `request_payload`, `response_payload`, `payment_payload_response`.

### PromotionalCode y TransactionCodeSequence

- Campañas con descuento por plan; secuencia numérica sin huecos vía `transaction_code_sequences` y bloqueo en `Transaction#next_transaction_code`.

### Otros

- **`sales_promoters`**: no aparece como tabla en el fragmento de schema mostrado en documentación previa; validar en migraciones actuales si el recurso persiste en otra tabla o servicio — en rutas v1 existe endpoint de validación.
- **`insured_cash_plans`**: planes “Insured Cash” con versionado en `insured_cash_plan_versions`.

## Validaciones importantes

- Transacciones: transiciones de estado restringidas; ciertos procesos activan `TransitionPayloadValidator` (`allow_transition_process?` en `Transaction`).
- Reglas: `RuleSchemasValidator` y presencia de `json_schema_payload` / `api_settings`.

## Siguiente lectura

- [API v1](./04-api-version-1.md) — uso de transacciones en HTTP
- [API v2](./05-api-version-2.md) — productos y reglas
