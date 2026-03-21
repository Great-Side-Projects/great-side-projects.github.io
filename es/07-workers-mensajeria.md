# Workers y mensajería

## Configuración

- `config/initializers/rabbitmq.rb` — AMQP, exchange, opciones Sneakers.
- `config/rabbitmq.yml`, `config/sneakers.yml`.

Workers usan `Rabbitmq::TaggedWorkerTracer` u otros concerns (`ErrorWorkable`, `ChargeRequestWorkable`, `CellphoneWorkable`, …) según el archivo.

## Inventario (cola → routing keys → clase)

Datos extraídos de `app/workers/**/*.rb`. Los `routing_key` pueden ser patrones con `*`.

| Cola | Routing keys (principales) | Clase |
|------|----------------------------|--------|
| `provider-service.confirm-transaction-status` | `messaging-gateway-service.epayco.payment_confirmation.received` | `ConfirmTransactionStatusWorker` |
| `provider-service.create-dana-certificate` | `notifier-service.policy.notify-settings.loaded` | `CreateDanaCertificateWorker` |
| `provider-service.create-policy-reinsurer-data` | `core-integration-service.policy.extended_resources.created` | `CreatePolicyReinsurerDataWorker` |
| `provider-service.create-policy-certificate` | `core-integration-service.policy.extended_resources.created` | `CreatePolicyCertificateLinkWorker` |
| `provider-service.create-policy-register-data` | `core-integration-service.policy.extended_resources.created` | `CreatePolicyRegisterDataWorker` |
| `provider-service.create-policy-register-collection-credit` | `core-integration-service.policy.extended_resources.renewed` | `CreatePolicyRegisterCreditWorker` |
| `provider-service.external-policy-number.search` | `core-integration-service.extended_resource.external_policy.update_request` | `SearchExternalPolicyNumberWorker` |
| `provider-service.report.transaction-document-send` | `scheduler-service.transaction-report-send.due-date.arrived` | `SendReportTransactionWorker` |
| `provider-service.cancel-policy-register` | `billing-service.*.billing.policy-plan-canceled`, `core-integration-service.policy.extended_resource.canceled` | `CancelPolicyRegisterCreditWorker` |
| `provider-service.cancel-policy-reinsurer-data` | `billing-service.*.billing.policy-plan-canceled`, `policy-service.*.policy.expired` | `CancelPolicyReinsurerDataWorker` |
| `provider-service.create-recurring-charge` | `data-egress-pipeline.product.recurring-charge-arrived` | `RecurringCharge::CreateRecurringChargeWorker` |
| `provider-service.recurring-charge.create-policy-request` | `billing-service.*.recurring-charge.installment_overdue`, `billing-service.*.recurring-charge.pending-installment` | `RecurringCharge::CreatePolicyChargeRequestWorker` |
| `provider-service.transaction.payment-confirmation` | `messaging-gateway-service.recurring_charge.confirmation` | `RecurringCharge::TransactionPaymentConfirmationWorker` |
| `provider-service.transaction.issuance-confirmation` | `core-integration-service.extended_resource.request.created` | `RecurringCharge::TransactionIssuanceConfirmationWorker` |
| `provider-service.transaction.confirm-subscription` | `messaging-gateway-service.subscription.confirmed`, `data-egress-pipeline.pending-subscription.confirmed` | `RecurringCharge::ConfirmTransactionSubscriptionWorker` |
| `provider-service.cancel-transaction-subscription` | `messaging-gateway-service.policy.cancelled` | `RecurringCharge::CancelTransactionSubscriptionWorker` |
| `provider-service.policy-issuance-confirmation` | `messaging-gateway-service.policy.confirmed` | `RecurringCharge::ConfirmPolicyIssuanceWorker` |
| `provider-service.cancel-policy-subscription` | `policy-service.*.policy.cancelled` | `RecurringCharge::CancelPolicySubscriptionWorker` |

Opciones comunes en `from_queue`: dead-letter `*-retry`, `timeout_job_after: 1.minute`, `retry_max_times: 4`, `retry_timeout: 15.minutes` (ver cada archivo para valores exactos).

## Depuración

- `bundle exec rake sneakers:run_debug` con `WORKERS=NombreWorker` (`lib/tasks/sneakers_debug.rake`).
- Tareas `reinsurer_worker:*` en `lib/tasks/send_reinsurer_worker_message.rake` (estado cola, envío de prueba, invocación directa).
- Doc adicional en repo: [`docs/flujo-reasegurador-y-api-pacifico.md`](../flujo-reasegurador-y-api-pacifico.md).

## Pruebas

`spec/workers/**/*.rb`

## Siguiente lectura

- [Tareas Rake](./08-tareas-operacion.md)
