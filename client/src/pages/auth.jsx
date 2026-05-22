import {useState} from 'react'
import Register from "../components/layout/auth/register"
import Login from "../components/layout/auth/login"


const Auth = () => {
  const [isRegistering, setIsRegistering] = useState(false)
  return (
    <div id="container">
        {isRegistering ? <Register setIsRegistering={setIsRegistering}/> : <Login/>}


        {!isRegistering ? (
            <>
                <h1 id="tituloIniciarSesion">¿Tienes una cuenta?</h1>
                <button id="botonIniciodeSesión" onClick={() => setIsRegistering(true)}>Iniciar Sesión</button>
            </>
            )
            :
            (
            <>
                <h1 id="tituloIniciarSesion">¿Tienes una cuenta?</h1>
                <button id="botonIniciodeSesión" onClick={() => setIsRegistering(true)}>Iniciar Sesión</button>
            </>  
            )
        }
    </div>
  )
}

export default Auth