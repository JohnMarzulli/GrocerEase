import { container } from 'tsyringe';
import type { InjectionToken } from 'tsyringe';

export function useService<T>(token: InjectionToken<T>): T {
  // For now we resolve directly; in the future we could add React context for scoped containers.
  return container.resolve<T>(token);
}
