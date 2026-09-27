import { createContext, type PropsWithChildren, use } from 'react';

import { createRepositories, type Repositories } from './container';

const RepositoryContext = createContext<Repositories | null>(null);

export function RepositoryProvider({ children }: PropsWithChildren) {
  return (
    <RepositoryContext value={createRepositories()}>{children}</RepositoryContext>
  );
}

export function useRepositories(): Repositories {
  const repositories = use(RepositoryContext);
  if (!repositories) {
    throw new Error('useRepositories debe usarse dentro de <RepositoryProvider />');
  }
  return repositories;
}
