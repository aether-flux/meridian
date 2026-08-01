import { createRoot } from "react-dom/client";
import "./style.css";
import AppRoutes from "./routes/AppRoutes.jsx";

// const App = () => (
//   <div>
//     <a href="https://vitejs.dev" target="_blank">
//       <img src="/vite.svg" className="logo" alt="Vite logo" />
//     </a>
//   </div>
// );

createRoot(document.getElementById("app")).render(<AppRoutes />);
