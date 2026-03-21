# Integración con proveedores (`lib/providers`)

## Mapa `ALLOWED_PROCESSES`

Fuente: `lib/providers/permitted_processes.rb`. Resume qué **clase cliente** se usa por **símbolo de proceso** y namespace.

### Namespace `v1` (`VERSION_ONE`)

Incluye entre otros:

- **Pacífico Seguros** (`PACIFICO_SEGUROS_CLIENT`): `vehicle_soat`, `protected_card`, `life_insurance`, `person_basic_data`, `certificate_link`, `register_data`, `register_credit`, `cancel_credit_policy`, `fraud_consultation`, `fullstack_v3`, `dana_certificate`, …
- **Pacífico Salud** (`PACIFICO_SALUD_CLIENT`): `insurances`, `policy_management_health`
- **Multi-tenant** (`TENANT_CLIENTS`): `car_plan`, `credit_plan`, `policy_tenancy` — submapas `pacifico_seguros`, `pacifico_salud`, `comfamiliar`
- **Assurant** / **Insurama**: `register_reinsurer`, `cancel_register_reinsurer`, `pacifico_insurama_reinsurer`
- **Yape**: `yape_gateway`
- **Tsana**: `tsana_assistances`
- **PGA**: `pga` (cliente dedicado `PgaClient`)

Cualquier proceso nuevo debe añadirse aquí o `RequestBroker` fallará con `NotExistingError`.

### Namespace `v2` (`VERSION_TWO`)

- `TENANT_CLIENTS_V2` para `issuance` (Pacífico Seguros / Salud clientes V2).
- Procesos directos: `life_insurance`, `protected_card`, `policy_management_health` con clientes `Providers::V2::*`.

## Cliente V2 Pacífico Seguros (patrón)

`Providers::V2::PacificoSeguros::Client`:

1. Recibe `payload` con configuración ya resuelta (método, endpoint, headers, parámetros).
2. Obtiene token vía `Authentication::<Processo>.instance` según `payload[:parameters][:process]`.
3. `Providers::V2::API::RequestBuilder` construye la petición; `execute_http_request` delega en `ClientBase` (GET/POST…).
4. Normaliza errores y respuesta en el builder.

Este patrón evita hardcodear URLs en cada servicio de negocio: la **Rule** en BD aporta `api_settings`.

## Tenencias configurables

Servicios bajo `app/services/configurable_process/` usan `ConfigurableProcess::Config` y `TenancyService` / `BaseService` con `RequestBroker` para procesos como tenencia de vida o salud (ver documentación en inglés en [provider-service.md](../../../platform-tech-docs/services/provider-service/provider-service.md) sección “New Tenancy Services”).

## Documentación de partner

Enlaces externos (ej. API A5) aparecen en el README del servicio aplicación; mantenerlos actualizados fuera de este repositorio si el partner cambia URL.

## Siguiente lectura

- [Arquitectura](./02-arquitectura.md)
- [Guía de código](./06-codigo-guia-desarrollador.md)
