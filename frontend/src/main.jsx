import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@fontsource/inter";
import "./styles/variables.css";
import "./styles/globals.css";
import App from './App.jsx'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ToastContainer
  position="top-right"
  autoClose={2500}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  pauseOnHover
  theme="colored"
/>
  </StrictMode>,
)
