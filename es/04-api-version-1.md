# API versión 1

Prefijo **`/v1`**, JSON por defecto (`config/routes.rb`). Controladores en `app/controllers/v1/`.

## Rutas y controladores

| Método | Ruta (relativa al prefijo `/v1`) | Controlador#acción |
|--------|-----------------------------------|---------------------|
| GET | `/protected_card_issuances/:holder_code` | *(declarado en rutas; convención `V1::ProtectedCardIssuancesController` — en revisión del árbol actual no hay archivo bajo `app/controllers/v1`; al implementar o al arrancar la app puede exigirse crear el controlador)* |
| GET | `/promotional_codes/:code` | `V1::PromotionalCodesController#show` (param `code`) |
| GET | `/promotional_codes` | `index` |
| POST | `/promotional_codes` | `create` (param interno `uid` en rutas REST) |
| PATCH/PUT | `/promotional_codes/:uid` | `update` |
| POST | `/reports` | `V1::ReportsController#create` |
| GET | `/sales_promoters/:sales_promoter_id` | `V1::SalesPromotersController#show` |
| GET | `/tenancies` | `V1::PolicyTenanciesController#index` |
| POST | `/assistances` | `V1::AssistancesController#create` |
| GET | `/policy_documents` | `V1::PolicyDocumentsController#show` (singular `resource`) |
| GET | `/insured_cash/plans` | `V1::InsuredCash::PlansController#index` |
| GET | `/transactions` | `V1::TransactionsController#index` |
| POST | `/transactions` | `create` |
| GET | `/transactions/:protocol_number` | `show` |
| POST | `/transactions/:transaction_protocol_number/status` | `V1::TransactionStateTransitionsController#create` |

> El nombre del parámetro anidado para la transición es **`transaction_protocol_number`** (convención de rutas anidadas de Rails con `param: :protocol_number` en el recurso padre).

## `TransactionsController#index` — scopes (`has_scope`)

Filtros soportados (ver controlador): `created_at` (hash `from`/`to`), `status`, `process`, `payment_method`, `document_number`, `plan`, `partner_key`, `subscription_id`. Paginación vía **Pagy** si viene `page`.

## Comportamiento transaccional

- **Crear:** `Transactions::BuilderService` con `operation: :create`.
- **Transición de estado:** mismo builder con `operation: :status_transition`; parámetros permitidos dependen del `process` (`StateTransitionsPermittedParams`).
- **Zona horaria:** `before_action :set_lima_default_timezone` en transacciones y transiciones (tenant Pacífico Seguros, salvo Flipper `bypass_lima_default_timezone`).

## Flipper API

`mount Flipper::Api.app(Flipper) => 'v1'` en `config/routes.rb` — API de feature flags bajo el prefijo configurado; puede convivir con rutas JSON de `namespace :v1`. Confirmar paths con `bin/rails routes` cuando el entorno tenga BD disponible.

## Documentación OpenAPI / Swagger

- Montaje: `Rswag::Ui` y `Rswag::Api` en **`/api/docs`** (`config/routes.rb`).
- Especificación: `swagger/v1/swagger.yaml` y JSON schemas en `swagger/v1/schemas/`.

## Manejo de errores (`ErrorHandler`)

Rescates relevantes para integradores (ver `app/controllers/concerns/error_handler.rb`):

- `RailsAPIUtils::ExceptionError`, `ActiveRecord::RecordInvalid`, `ParameterMissing` → 422.
- `ActiveRecord::RecordNotFound` → 404 con payload normalizado.
- `Providers::RequestBroker::NotExistingError`, `Brokers::BaseManager::TransactionUndefinedError`, errores de `Transactions::BuilderService` / `StatusTransitionService` → transacción inválida (422 JSON estructurado).
- `Providers::ClientBase::ConnectionError` → 401.
- `Schemas::Errors` (tenancy) → 422 con payload de tenancy.
- `Monokera::SDK::ResourceNotFound` / `ClientError`.
- Errores **Pagy** → 422 paginación.

## Pruebas de contrato

`spec/requests/v1/**/*.rb` — fuente de verdad para payloads permitidos además de validadores en `app/validators/`.

## Siguiente lectura

- [API v2](./05-api-version-2.md)
- [Guía de código](./06-codigo-guia-desarrollador.md)
