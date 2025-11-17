'use client';

import { MathJaxContext } from 'better-react-mathjax';
import type { PropsWithChildren } from 'react';

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
    <MathJaxContext version={3} config={mathJaxConfig}>
      {children}
    </MathJaxContext>
  );
};

export default Providers;
