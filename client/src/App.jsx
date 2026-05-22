import {BrowserRouter, Route, Routes} from "react-router-dom"
import Inicio from "./pages/inicio"

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/inicio" element={<Inicio />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
