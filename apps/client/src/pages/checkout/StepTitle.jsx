import { useEffect, useRef } from 'react'

// Titulo de cada paso. Al cambiar de paso la vista sube y el foco se va al titulo,
// asi el lector de pantalla sabe que cambio la pantalla
function StepTitle({ children }) {
    const titleRef = useRef(null)

    useEffect(() => {
        window.scrollTo(0, 0)
        titleRef.current?.focus()
    }, [])

    return <h2 ref={titleRef} className='checkout-step-title' tabIndex={-1}>{children}</h2>
}

export default StepTitle
