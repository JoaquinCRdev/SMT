import {BrowserRouter, Route, Routes} from "react-router-dom"
import Inicio from "./pages/inicio"
import RegisterAdmin from "./components/layout/auth/registerAdmin"

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/registerAdmin" element={<RegisterAdmin />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
