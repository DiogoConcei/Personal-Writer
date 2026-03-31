import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // Aqui configuraremos hidratadores de store, temas, etc. futuramente
  return (
    <>
      {children}
    </>
  );
}
