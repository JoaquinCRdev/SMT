import {BrowserRouter, Route, Routes} from "react-router-dom"
import Inicio from "./pages/inicio"
import RegisterAdmin from "./components/layout/auth/registerAdmin"
import Register from "./components/layout/auth/register"
import AsociarseTaller from "./components/layout/asociarseTaller"
import Login from "./components/layout/auth/login"
import RegisterTallerCodigo from "./pages/registroTallerCodigo"
import Planes from "./pages/planes"
import Mismaquinas from "./pages/mismaquinas"
import TarjetaMaquina from "./components/tarjetamismaquinas"
import RegistrarTaller from "./pages/registrarTaller"
import Home from "./pages/home"
import Configuracion from "./pages/configuracion"
import Historial from "./pages/historial"

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/historial" element={<Historial/>} />
          {/* <Route path="/inicio" element={<Inicio />} /> */}
          <Route path="/crearTaller" element={<RegisterAdmin />} />
          <Route path="/registerPersonal" element={<Register />} />
          <Route path="/asociarseTaller" element={<AsociarseTaller />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registerTallerCodigo" element={<RegisterTallerCodigo />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/mismaquinas" element={<Mismaquinas />} />
          <Route path="/tarjetamaquina" element={<TarjetaMaquina />} />
          <Route path="/registrarTaller" element={<RegistrarTaller />} />
          <Route path="/home" element={<Home />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </BrowserRouter>
    </div> 
  )
}

export default App
