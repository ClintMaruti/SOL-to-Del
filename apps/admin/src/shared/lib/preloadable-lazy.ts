import { createElement, lazy, type ComponentType } from "react";

type LazyPageModule = {
  default: ComponentType;
};

export function createPreloadableLazy(loader: () => Promise<LazyPageModule>): {
  element: ComponentType;
  preload: () => Promise<LazyPageModule>;
} {
  let loadedComponent: ComponentType | null = null;
  let loadPromise: Promise<LazyPageModule> | null = null;

  const load = () => {
    loadPromise ??= loader().then((module) => {
      loadedComponent = module.default;
      return module;
    });
    return loadPromise;
  };

  const LazyComponent = lazy(load);

  const PreloadableComponent: ComponentType = () => {
    const LoadedComponent = loadedComponent;

    if (LoadedComponent) {
      return createElement(LoadedComponent);
    }

    return createElement(LazyComponent);
  };

  return {
    element: PreloadableComponent,
    preload: load,
  };
}
