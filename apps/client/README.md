# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Validación compartida de formularios (SCRUM-97)

Usar `noValidate` y `useFormulario` para mostrar todos los errores al enviar,
conservar el foco mientras se corrige y enfocar el primer campo inválido al
reenviar. No usar `required` nativo: `atributosCampo` agrega `aria-required`,
`aria-invalid`, `name` y la relación con el mensaje mediante `aria-describedby`.

```jsx
import { useFormulario } from './hooks/useFormulario.js'

const campos = {
    nombre: { obligatorio: true },
    costo: { obligatorio: true, tipo: 'numero', minimo: 0 },
    codigo: { obligatorio: true, patron: /^[A-Z0-9-]+$/ },
}

function Formulario({ guardar }) {
    const {
        valores, errores, formularioRef, cambiarCampo, validar,
        erroresServidor, atributosCampo, idError,
    } = useFormulario({ nombre: '', costo: '', codigo: '' }, campos)

    const enviar = async (event) => {
        event.preventDefault()
        if (!validar()) return
        try {
            await guardar(valores)
        } catch (error) {
            erroresServidor(error.detalles?.campos)
        }
    }

    return (
        <form ref={formularioRef} noValidate onSubmit={enviar}>
            {Object.keys(campos).map((campo) => (
                <label key={campo} className='product-form-field'>
                    <span>{campo}</span>
                    <div className='product-form-input'>
                        <input
                            {...atributosCampo(campo)}
                            value={valores[campo]}
                            onChange={(event) => cambiarCampo(campo, event.target.value)}
                        />
                    </div>
                    {errores[campo] && (
                        <p id={idError(campo)} className='product-form-error'>{errores[campo]}</p>
                    )}
                </label>
            ))}
            <button type='submit'>Guardar</button>
        </form>
    )
}
```

Los tipos disponibles son `numero`, `entero`, `correo` y `url` (http/https).
`minimo` admite `exclusivo: true`; `mensajeMinimo` y `mensajePatron` permiten
personalizar los mensajes. Un opcional vacío no se valida y cero es válido.
`reiniciar(valores)` limpia los errores y restablece los valores.
Si los nombres del servidor difieren de los inputs, convertir `detalles.campos`
antes de pasarlos a `erroresServidor` (como `toModalFields` en Productos).
Mantener también el mensaje general de error y el estado de envío de la pantalla.

Comprobaciones:

```bash
node --test src/utils/validarCampos.test.js
npm run lint
npm run build
```

[Evidencia de Agregar producto vacío](../../documentos/sprint-02/evidencias/SCRUM-97-campos-obligatorios.png):
código, nombre, categoría (el campo actual para la familia) y costo en rojo al
mismo tiempo. Capturada en Firefox sin interfaz, con respuestas de API simuladas.
También se verificaron bloqueo de envíos inválidos, foco en el primer error,
corrección sin saltos de foco, campos opcionales, guardado válido, errores de
`detalles.campos`, acceso y edición de producto.
