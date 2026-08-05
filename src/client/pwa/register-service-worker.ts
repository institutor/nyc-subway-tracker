export interface SubwayServiceWorkerContainer {
  register(
    scriptURL: string | URL,
    options?: RegistrationOptions,
  ): Promise<ServiceWorkerRegistration>;
}

export interface SubwayServiceWorkerNavigator {
  readonly serviceWorker?: SubwayServiceWorkerContainer;
}

export async function registerSubwayServiceWorker(
  navigatorState: SubwayServiceWorkerNavigator = typeof navigator === 'undefined' ? {} : navigator,
): Promise<ServiceWorkerRegistration | undefined> {
  if (!navigatorState.serviceWorker) return undefined;
  try {
    return await navigatorState.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
  } catch {
    return undefined;
  }
}
