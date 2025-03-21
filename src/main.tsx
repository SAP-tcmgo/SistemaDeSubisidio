
import { createRoot } from 'react-dom/client';
import App from './App';
import './firebase'; // Import firebase to ensure initialization occurs

createRoot(document.getElementById("root")!).render(<App />);
