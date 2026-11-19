import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initI18n } from "./i18n";

// Seçili dil İngilizce ise sözlük hemen indirilmeye başlasın
initI18n();

createRoot(document.getElementById("root")!).render(<App />);
