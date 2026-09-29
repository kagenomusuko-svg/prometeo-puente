# Despachador de comandos públicos

`src/public-command-dispatcher.mjs` es la frontera defensiva entre el adaptador de `prometeo-sitio` y las operaciones internas del puente.

## Responsabilidad

- validar nuevamente el sobre recibido;
- rechazar operaciones desconocidas;
- exigir actor, fecha, razón, proveniencia y versión esperada;
- impedir decisiones atribuidas al lenguaje;
- impedir que el sitio envíe resultados o trazas matemáticas;
- delegar la operación a un handler explícito.

El despachador no contiene reglas de dominio, no persiste eventos y no calcula. Los handlers inyectados conservan la responsabilidad de ejecutar cada operación mediante el componente autorizado.

## Contrato de decisión

La operación `record-analyst-decision` recibe la decisión dentro de `payload.decision`. El sobre conserva la metainformación de auditoría en su nivel superior y la decisión contiene únicamente la transición que será delegada:

```json
{
  "operation": "record-analyst-decision",
  "payload": {
    "decision": {
      "action": "confirm",
      "targetObjectId": "hypothesis-1",
      "resultingObjectId": "model-1",
      "resultingVersion": "1.0.0"
    }
  }
}
```

Esta forma coincide con el adaptador de `prometeo-sitio` y evita que la frontera mezcle la orden pública con su auditoría.

## Uso

`dispatchPublicCommand(command, { handlers })` valida y entrega al handler correspondiente una copia del payload.

`createPublicCommandDispatcher(handlers)` crea una función reutilizable para el adaptador de transporte.

Si falta un handler, la operación se rechaza con `MISSING_HANDLER`. Los errores de forma son fail-closed mediante `BridgeCommandError`.
