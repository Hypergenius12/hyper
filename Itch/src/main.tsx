import { setupClientApi } from './setupClientApi';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

setupClientApi();

createRoot(document.getElementById('root')!).render(<App />);
