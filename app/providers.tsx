'use client';

import { MathJaxContext } from 'better-react-mathjax';
import type { PropsWithChildren } from 'react';

import { AuthProvider } from '@/context/AuthContext';

const mathJaxConfig = {
  tex: {
    inlineMath: [
      ['\\(', '\\)'],
      ['$', '$']
    ]
  }
};

const Providers = ({ children }: PropsWithChildren) => {
  return (
    <AuthProvider>
      <MathJaxContext version={3} config={mathJaxConfig}>
        {children}
      </MathJaxContext>
    </AuthProvider>
  );
};

export default Providers;
