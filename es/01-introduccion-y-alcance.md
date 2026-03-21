# Introducción y alcance

## Qué es

Microservicio **Rails API** que integra ventas y pólizas de Monokera con APIs de **Pacífico Seguros**, **Pacífico Salud**, **Asissprex (Comfamiliar)**, **Assurant**, **Insurama**, **Tsana**, **Yape**, etc. Persiste **transacciones** (`transactions`), expone **v1** (flujo transaccional clásico) y **v2** (reglas y productos configurables en BD), y consume **RabbitMQ** mediante **Sneakers**.

## Qué no es

- No reemplaza Order Service ni el gateway de pagos; reacciona a mensajes y actualiza estado/payloads.
- La documentación legal/comercial de cada producto asegurador es externa; aquí solo el **comportamiento del código**.

## Stack (fuente: `Gemfile` / `Gemfile.lock`)

| Componente | Detalle |
|------------|---------|
| Ruby | `3.2.2` |
| Rails | `8.0.x` (ej. 8.0.2 en lock) |
| BD | PostgreSQL (`pg`), extensiones vía `monokera:db:extensions` |
| Multi-tenant | `ros-apartment` (`Apartment::Tenant`) |
| Mensajería | Gem `rabbitmq` + Sneakers |
| Feature flags | `flipper-active_record`, API en rutas |
| HTTP cliente | Faraday (`lib/providers/client_base.rb`) |
| Validación JSON | `json_schemer` |
| Paginación | Pagy |
| Observabilidad | Datadog, Lograge |
| Privado Monokera | `monokera-sdk`, `rails_api_utils`, etc. (JFrog) |

> El README raíz del repo puede citar versiones antiguas; la referencia técnica es **Gemfile.lock**.

## Puntos de entrada útiles

| Necesidad | Ubicación |
|-----------|-----------|
| Rutas HTTP | `config/routes.rb` |
| Errores API | `app/controllers/concerns/error_handler.rb` |
| Máquina de estados transacción | `app/models/transaction.rb` |
| Qué servicio corre en create/transition v1 | `app/models/brokers/permitted_procedures.rb`, `process_manager.rb`, `transition_manager.rb` |
| Cliente por proceso | `lib/providers/request_broker.rb`, `permitted_processes.rb` |
| Esquema BD | `db/schema.rb` |

## Siguiente lectura

- [Arquitectura](./02-arquitectura.md)
- [Mapa del repositorio](./11-mapa-repositorio.md)
