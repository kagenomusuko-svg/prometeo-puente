# Primer hito funcional del Vertical Slice

## Estado

El Vertical Slice inicial de Prometeo está ejecutable hasta `ReportModel`.

## Cadena verificada

1. `SourceDocument` normalizado.
2. Propuestas lingüísticas en estado `proposed`.
3. Decisión explícita con proveniencia humana.
4. `ConfirmedModel` enlazado con la decisión.
5. `MotorRequest` producido por proyección determinista.
6. `MotorResult` y `CalculationTrace` adaptados desde el motor.
7. `ReportModel` construido por `prometeo-informe`.
8. Referencias contextuales conservadas en el informe.

## Reproducibilidad

La prueba local de coordinación es:

```bash
npm install
npm run ecosystem-slice
```

Ese comando verifica hasta la entrada del informe cuando no se proporciona un generador externo.

La integración completa se ejecuta en GitHub Actions. El workflow:

- obtiene este repositorio;
- obtiene `prometeo-informe` en el commit `cfc6d00bf87637a3b3864be121490f8a17b2c322`;
- instala el puente sin dependencia runtime oculta;
- establece `PROMETEO_INFORME_PATH`;
- ejecuta la construcción real de `ReportModel`.

## Fronteras preservadas

- `prometeo-lenguaje` sólo propone.
- `prometeo-caso` conserva la decisión humana.
- `prometeo-proyeccion` sólo proyecta modelos confirmados.
- `prometeo-puente` coordina y adapta.
- `prometeo-motor-calculo` conserva autoridad matemática.
- `prometeo-informe` ensambla el informe.
