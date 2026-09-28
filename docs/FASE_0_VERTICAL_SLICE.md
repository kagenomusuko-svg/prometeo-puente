# Fase 0 — vertical slice completo

El caso canónico de Fase 0 se representa en tests/fixtures/canonical-case.json y conserva esta cadena:

```text
SourceDocument
        ↓
propuestas lingüísticas
        ↓
decisión humana
        ↓
ConfirmedModel
        ↓
MotorRequest
        ↓
prometeo-motor-calculo
        ↓
MotorResult + CalculationTrace
        ↓
entrada de prometeo-informe
```

## Responsabilidades verificadas

- ingesta conserva el documento y el fragmento;
- lenguaje sólo produce objetos proposed;
- caso registra la decisión humana y el modelo confirmado;
- proyección entrega un MotorRequest explícito;
- puente adapta sin calcular;
- el motor entrega el resultado y la traza;
- contexto consultado llega como referencia separada;\n- informe recibe los objetos sin reinterpretarlos.

La ejecución HTTP contra api/server.py del repositorio prometeo-motor-calculo fue validada por separado con el mismo request y produjo el mismo resultado exacto. Esta prueba contractual usa un fixture de respuesta para mantener el test determinista y aislado del despliegue.


El caso canónico incorpora el estado reducido del expediente y el puente lo entrega a `prometeo-informe` en la sección `case-audit`.


El puente recibe `caseEvents` y delega la reconstrucción a `prometeo-caso`; no transporta un estado reducido preparado manualmente.
\n\nLa prueba reproducible carga los eventos en `createCaseEventStore`, los lee por `caseId` y entrega esa copia al puente antes de reconstruir el agregado.\n

## Slice generativo

`generated-vertical-slice.test.mjs` construye el caso desde cero: registra la propuesta lingüística, aplica una decisión humana mediante `prometeo-caso`, persiste los eventos en el event store, proyecta el modelo confirmado y ejecuta el informe. El caso canónico deja de ser la única evidencia del recorrido completo.
