# Workers y mensajería

## Infraestructura

- Configuración central: `config/initializers/rabbitmq.rb` (lee `config/rabbitmq.yml` y `config/sneakers.yml`).
- Workers: gem **Sneakers**; clases en `app/workers/**/*.rb`.

> Tabla de enlaces: rutas relativas a **platform-tech-docs** en monorepo; ver [README](./README.md) para GitHub.

## Lista de workers (código actual)

Colocados en `app/workers/` (revisar `grep class.*Worker` o listado de archivos para el inventario al día):

| Área | Archivo (ejemplo) | Documentación (platform-tech-docs) |
|------|-------------------|-------------------------------------|
| Cargos recurrentes | `recurring_charge/create_recurring_charge_worker.rb` | [create-recurring-charge.md](../../../platform-tech-docs/services/provider-service/workers/recurring-charge/create-recurring-charge.md) |
| | `recurring_charge/create_policy_charge_request_worker.rb` | [create-policy-charge-request.md](../../../platform-tech-docs/services/provider-service/workers/recurring-charge/create-policy-charge-request.md) |
| | `recurring_charge/transaction_payment_confirmation_worker.rb` | [transaction-payment-confirmation.md](../../../platform-tech-docs/services/provider-service/workers/recurring-charge/transaction-payment-confirmation.md) |
| | `recurring_charge/transaction_issuance_confirmation_worker.rb` | [transaction-issuance-confirmation.md](../../../platform-tech-docs/services/provider-service/workers/recurring-charge/transaction-issuance-confirmation.md) |
| | `recurring_charge/confirm_transaction_subscription_worker.rb` | [confirm-transaction-subscription.md](../../../platform-tech-docs/services/provider-service/workers/recurring-charge/confirm-transaction-subscription.md) |
| | `recurring_charge/cancel_transaction_subscription_worker.rb` | [cancel-transaction-subscription.md](../../../platform-tech-docs/services/provider-service/workers/recurring-charge/cancel-transaction-subscription.md) |
| | `recurring_charge/confirm_policy_issuance_worker.rb` | [confirm-policy-issuance.md](../../../platform-tech-docs/services/provider-service/workers/recurring-charge/confirm-policy-issuance.md) |
| | `recurring_charge/cancel_policy_subscription_worker.rb` | [cancel-policy-subscription.md](../../../platform-tech-docs/services/provider-service/workers/recurring-charge/cancel-policy-subscription.md) |
| Estado transacción | `confirm_transaction_status_worker.rb` | [confirm-transaction-status.md](../../../platform-tech-docs/services/provider-service/workers/confirm-transaction-status.md) |
| Reportes | `send_report_transaction_worker.rb` | [send-transaction-report.md](../../../platform-tech-docs/services/provider-service/workers/send-transaction-report.md) |
| Póliza / Pacifico | `create_policy_register_data_worker.rb`, `create_policy_register_credit_worker.rb`, `create_policy_certificate_link_worker.rb`, `create_dana_certificate_worker.rb`, `create_policy_reinsurer_data_worker.rb`, `cancel_policy_register_credit_worker.rb`, `cancel_policy_reinsurer_data_worker.rb`, `search_external_policy_number_worker.rb` | (documentar en workers si falta página; ver nombre de cola en cada worker) |

Muchos workers incluyen concerns en `app/workers/concerns/` (`error_workable`, `partner_workable`, `ratelimit_workable`, etc.) para comportamiento transversal.

## Relación con la documentación en inglés

La tabla “Available Workers” de [provider-service.md](../../../platform-tech-docs/services/provider-service/provider-service.md) enlaza a los mismos Markdown de `workers/`; esta guía en español **no duplica** el contenido de cada cola — remite a esos archivos para payloads, exchanges y efectos secundarios.

## Depuración local

- Scripts en `script/` (p. ej. ejecución puntual de workers o reinsurer).
- En este repo: [`../flujo-reasegurador-y-api-pacifico.md`](../flujo-reasegurador-y-api-pacifico.md) y otros `.puml` bajo `docs/` si necesitáis flujo Assurant/Insurama.

## Siguiente lectura

- [Tareas operación](./08-tareas-operacion.md)
