# Integración con proveedores

## `ALLOWED_PROCESSES` — `lib/providers/permitted_processes.rb`

### `v1` (`VERSION_ONE`)

| Clave (símbolo proceso) | Cliente / notas |
|-------------------------|-----------------|
| `yape_gateway` | `Providers::YapeSeguros::Client` |
| `register_reinsurer`, `cancel_register_reinsurer` | `Providers::Assurant::Client` |
| `pacifico_insurama_reinsurer` | `Providers::Insurama::Client` |
| `vehicle_soat`, `protected_card`, `mibanco_protected_card`, `life_insurance`, `person_basic_data`, `certificate_link`, `dana_certificate`, `register_data`, `register_credit`, `cancel_credit_policy`, `fraud_consultation`, `fullstack_v3`, `policy_management_life`, … | `Providers::PacificoSeguros::Client` |
| `insurances`, `policy_management_health` (salud) | `Providers::PacificoSalud::Client` |
| `car_plan`, `credit_plan`, `policy_tenancy` | Hash por tenant → `TENANT_CLIENTS` (`pacifico_seguros`, `pacifico_salud`, `comfamiliar` → clientes Asissprex/Pacífico según mapa) |
| `tsana_assistances` | `Providers::Tsana::Client` |
| `pga` | `Providers::PacificoSeguros::PgaClient` |

### `v2` (`VERSION_TWO`)

| Clave | Cliente |
|-------|---------|
| `life_insurance`, `protected_card` | `Providers::V2::PacificoSeguros::Client` |
| `issuance` | Hash por tenant `TENANT_CLIENTS_V2` (Pacífico Seguros / Salud v2) |
| `policy_management_health` | `Providers::V2::PacificoSalud::Client` |

Cualquier proceso usado en `RequestBroker` debe existir aquí o se lanza `NotExistingError`.

---

## `Brokers::PermittedProcedures::TRANSACTIONS`

Invocados en flujos donde `ProcessManager` resuelve por `type` + `process` (a veces el valor es un **Hash** por canal/tenant → ver `process_manager.rb`).

| `type` | `process` | Servicio (o mapa) |
|--------|-----------|-------------------|
| `create_quote` | `vehicle_soat` | `PacificoSeguros::VehicleSoat::CreateQuoteService` |
| `create_quote` | `person_basic_data` | `PacificoSeguros::CreatePersonService` |
| `create_quote` | `protected_card` | Mapa `pacifico_seguros` / `mi_banco` → CreateQuoteService |
| `create_quote` | `life_insurance` | Mapa `pacifico_seguros` / `mi_banco` |
| `create_quote` | `insurances` | Mapa `yape` → `Yape::Insurances::CreateQuoteService` |
| `create_quote` | `cellphone` | `PacificoSeguros::Cellphone::MonokeraCore::CreateQuoteService` |
| `create_quote` | `pymes` | `PacificoSeguros::Pymes::CreateQuoteRouterService` |
| `create_policy` | `certificate_link` | `PacificoSeguros::CreateCertificateLinkService` |
| `create_policy` | `register_data` | `PacificoSeguros::CreatePolicyRegisterDataService` |
| `create_policy` | `register_credit` | `PacificoSeguros::CreatePolicyRegisterCreditService` |
| `create_policy` | `register_reinsurer` | Mapa `default` → Assurant; `per:product:insurama` → Insurama |
| `create_policy` | `dana_certificate` | `PacificoSeguros::CreateDanaCertificateService` |
| `cancel_policy` | `cancel_credit_policy` | `PacificoSeguros::CancelCreditPolicyService` |
| `cancel_policy` | `cancel_register_reinsurer` | `PacificoSeguros::Cellphone::Assurant::CancelPolicyService` |
| `create_validation` | `fraud_consultation` | `PacificoSeguros::FraudConsultation::CreateValidationService` |

**Default por tenant** (cuando aplica): `default_transactions` → `"::#{tenant.camelize}::CreateQuoteService"`.

---

## `Brokers::PermittedProcedures::TRANSITIONS`

Usado por `TransitionManager` como `TRANSITIONS[status][process]` → valor es clase o **Hash por broker** (string).

### Estado `approved` (emisión / creación tras pago)

| `process` | Destino (mapa o clase) |
|-----------|-------------------------|
| `car_plan`, `credit_plan` | `comfamiliar` → `Asissprex::CreatePlanService` |
| `vehicle_soat` | `pacifico_seguros` → VehicleSoat CreatePolicy |
| `protected_card` | `pacifico_seguros`, `mi_banco` |
| `life_insurance` | `pacifico_seguros`, `mi_banco` |
| `cellphone` | `pacifico_seguros` |
| `insurances` | `pacifico_salud` → CreatePolicy |
| `pymes` | `pacifico_seguros` → CreatePolicyRouter |

### Estado `rejected`

| `process` | Mapa |
|-----------|------|
| `create_plan` | `comfamiliar` → Asissprex CreatePlan |

### Estado `canceled`

| `process` | Mapa |
|-----------|------|
| `protected_card` | `pacifico_seguros` → Cancel |
| `life_insurance` | `pacifico_seguros` |
| `vehicle_soat` | `pacifico_seguros` |
| `cellphone` | `pacifico_seguros` |
| `pymes` | `pacifico_seguros` |

---

## Cliente V2 Pacífico Seguros

`lib/providers/v2/pacifico_seguros/client.rb`: token por proceso (`Authentication::*`), `RequestBuilder`, `execute_http_request` sobre `ClientBase`.

## Proceso configurable (tenencias)

`app/services/configurable_process/*` + `RequestBroker` con configuración por `ConfigurableProcess::Config`.

## Siguiente lectura

- [Guía de código](./06-codigo-guia-desarrollador.md)
- [Modelo de datos](./03-modelo-datos-y-dominio.md)
