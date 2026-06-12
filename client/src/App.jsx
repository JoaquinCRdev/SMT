import {BrowserRouter, Route, Routes} from "react-router-dom"
import Inicio from "./pages/inicio"
import RegisterAdmin from "./components/layout/auth/registerAdmin"
import RegisterPersonal from "./components/layout/auth/registerPersonal"
import Login from "./components/layout/auth/login"
import RegisterTallerCodigo from "./pages/registroTallerCodigo"
import RegisterCase1 from "./components/layout/auth/registercase1"
import RegisterCase2 from "./components/layout/auth/registercase2"
import RegisterCase3 from "./components/layout/auth/registercase3"

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
          <Route path="/registerwait" element={<RegisterCase1 />} />
          <Route path="/registerconfirm" element={<RegisterCase2 />} />
          <Route path="/registererror" element={<RegisterCase3 />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
