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
- informe recibe los objetos sin reinterpretarlos.

La ejecución HTTP contra api/server.py del repositorio prometeomotorcalculo fue validada por separado con el mismo request y produjo el mismo resultado exacto. Esta prueba contractual usa un fixture de respuesta para mantener el test determinista y aislado del despliegue.
