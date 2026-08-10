import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

import { App, type AppProps } from './App';
import './styles/global.css';

export function mountClient(root: HTMLElement, content: ReactNode, strict = true): void {
  createRoot(root).render(strict ? <StrictMode>{content}</StrictMode> : content);
}

export function mountSubwayApp(root: HTMLElement, props: AppProps = {}): void {
  mountClient(root, <App {...props} />);
}
