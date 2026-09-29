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

## Uso

`dispatchPublicCommand(command, { handlers })` valida y entrega al handler correspondiente una copia del payload.

`createPublicCommandDispatcher(handlers)` crea una función reutilizable para el adaptador de transporte.

Si falta un handler, la operación se rechaza con `MISSING_HANDLER`. Los errores de forma son fail-closed mediante `BridgeCommandError`.
