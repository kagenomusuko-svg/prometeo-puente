# Ejecución CI del vertical slice real

El workflow `.github/workflows/ecosystem-slice-authenticated.yml` se ejecuta manualmente mediante `workflow_dispatch`.

## Requisito de acceso

El repositorio necesita el secreto:

```
PROMETEO_READ_TOKEN
```

Debe permitir leer los repositorios privados o restringidos que el workflow fija por commit:

- `prometeo-ingesta`
- `prometeo-contexto`
- `prometeo-lenguaje`
- `prometeo-esquema`
- `prometeo-informe`
- `prometeo-caso`
- `prometeo-proyeccion`
- `prometeo-motor-calculo`

El token no se escribe en archivos ni se imprime en logs.

## Qué ejecuta

El workflow:

1. obtiene las versiones fijadas de las islas;
2. instala y valida `prometeo-esquema`;
3. levanta `prometeo-motor-calculo` en `127.0.0.1:8000`;
4. ejecuta el vertical slice existente;
5. ejecuta el slice generado de ingesta, contexto y lenguaje;
6. ejecuta `tests/real-vertical-slice.test.mjs` con `confirmModel`, `projectConfirmedModel`, el motor HTTP, `reconstructCaseAggregate` y `buildReport`.

La prueba real no utiliza resultados simulados. Si se ejecuta fuera de este workflow sin las variables de servicio, se marca como `SKIP`; dentro de este workflow todas las rutas y la URL del motor están definidas, por lo que debe ejecutarse realmente.

## Ejecución

En GitHub:

1. abrir **Actions** en `prometeo-puente`;
2. seleccionar **Authenticated ecosystem vertical slice**;
3. pulsar **Run workflow** sobre `main`.

Un fallo de facturación o límite de GitHub Actions ocurre antes de iniciar el job y no constituye un fallo del contrato Prometeo. Debe resolverse en la configuración de la cuenta para obtener la validación remota.
