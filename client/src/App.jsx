import {BrowserRouter, Route, Routes} from "react-router-dom"
import Inicio from "./pages/inicio"
import RegisterAdmin from "./components/layout/auth/registerAdmin"
import RegisterPersonal from "./components/layout/auth/registerPersonal"
import Login from "./components/layout/auth/login"
import RegisterTallerCodigo from "./pages/registroTallerCodigo"

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/registerAdmin" element={<RegisterAdmin />} />
          <Route path="/registerPersonal" element={<RegisterPersonal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registerTallerCodigo" element={<RegisterTallerCodigo />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
