# Guía de código para desarrolladores

## Árbol funcional principal

| Ruta en repo | Rol |
|--------------|-----|
| `app/controllers/v1`, `v2` | HTTP; incluyen `ErrorHandler` vía `ApplicationController` |
| `app/services/` | Casi todo el negocio (por tenant/proceso: `pacifico_seguros`, `pacifico_salud`, `v2`, `transactions`, …) |
| `app/models/` | ActiveRecord + brokers (`process_manager`, `transition_manager`, `permitted_procedures`) |
| `app/workers/` | Sneakers |
| `app/serializers/` | AMS + `builders/` para payloads dinámicos |
| `app/validators/` | JSON Schema y validadores de dominio |
| `lib/providers/` | Clientes Faraday, autenticación por proceso, namespaces `v2` |
| `config/routes.rb` | Contrato público |
| `config/initializers/rabbitmq.rb` | RabbitMQ + Sneakers |

Listado de **carpetas top** en `app/services/`: `asissprex`, `assistances`, `configurable_process`, `mi_banco`, `monokera_core`, `pacifico_salud`, `pacifico_seguros`, `policy_tenancies`, `promotional_codes`, `recurring_charge`, `reports`, `schemas`, `transactions`, `v2`, `yape`, `yape_seguros`, más `concerns/` y servicios sueltos.

## `Providers::RequestBroker`

- Archivo: `lib/providers/request_broker.rb`.
- `client(payload)` resuelve clase desde `Providers::PermittedProcesses::ALLOWED_PROCESSES[:v1 | :v2][process]`.
- Procesos multi-tenant (`TENANT_PLAN_PROCESSES`): el valor es un **Hash** por `Apartment::Tenant.current.to_sym`.
- Si no hay clase: `Providers::RequestBroker::NotExistingError` → manejado en `ErrorHandler`.

Diagrama: [`diagramas/request-broker.puml`](./diagramas/request-broker.puml).

## Flujo v1 — creación y proceso

- **`Brokers::ProcessManager`:** usado cuando hay que ejecutar el proveedor según `transaction.type` y `transaction.process`; mapeo en `PermittedProcedures::TRANSACTIONS` (valores pueden ser clase o Hash anidado por `product_uid` / `distributor_channel` — ver código).
- **`Brokers::TransitionManager`:** transiciones tras cambio de estado; usa `PermittedProcedures::TRANSITIONS[status][process][broker]` (tercer índice es el **broker** en string).

## Flujo v2

- `V2::Rules::ConfigurationService`, `V2::Policies::CreateService`, `V2::Quotes::CreateService`, `V2::Cancellations::CreateService`.

## Builders

- `Builders::BaseGenerator.build(process:, **args)` → `app/serializers/builders/<proceso>/...`
- `Builders::BaseDeliverer.build(type:, schema:, **args)` → serializers por tipo/esquema.

Errores si falta clase: `RailsAPIUtils::ExceptionError` (mensajes i18n `generator_not_found` / `serializer_not_found`).

## `ApplicationController`

- `ActionController::API` + `ErrorHandler` + helpers Pagy.
- `set_lima_default_timezone`: solo tenant `pacifico_seguros`, header `timezone` o bypass Flipper.

## Checklist — nuevo proceso de integración

1. Añadir símbolo a `Transaction::TRANSACTION_PROCESSES` (y usos en reglas si aplica).
2. Registrar en `lib/providers/permitted_processes.rb` (`VERSION_ONE` / `VERSION_TWO`).
3. v1: enlazar servicio en `Brokers::PermittedProcedures::TRANSACTIONS` y/o `TRANSITIONS`.
4. v2: reglas en BD + `RuleAssignment`; validar `V2::RuleConfigurationValidator`.
5. Añadir worker/ruta/specs y actualizar `docs/es/04`, `07`, `09`.

## Siguiente lectura

- [Workers](./07-workers-mensajeria.md)
- [Mapa del repositorio](./11-mapa-repositorio.md)
