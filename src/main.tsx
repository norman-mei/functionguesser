import React from 'react';
import ReactDOM from 'react-dom/client';
import { MathJaxContext } from 'better-react-mathjax';
import App from './App';
import './index.css';

const mathJaxConfig = {
  tex: {
    inlineMath: [
      ['\\(', '\\)'],
      ['$', '$']
    ]
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MathJaxContext version={3} config={mathJaxConfig}>
      <App />
    </MathJaxContext>
  </React.StrictMode>
);
