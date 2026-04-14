import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import TablePage from "@/pages/TablePage";
import AdminPage from "@/pages/AdminPage";
import Background from "@/components/Background";

function App() {
  return (
    <div className="App">
      <Background />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/table/:id" element={<TablePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
