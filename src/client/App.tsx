import { productName } from '../shared';

const shellStyle = {
  background: '#101519',
  color: '#f8f4eb',
  fontFamily: 'Arial, sans-serif',
  minHeight: '100vh',
  padding: '2rem',
} as const;

export function App() {
  return (
    <main aria-labelledby="app-title" style={shellStyle}>
      <header>
        <p aria-label="Product status">Unofficial</p>
        <h1 id="app-title">{productName}</h1>
        <p>A clear starting point for your subway trip.</p>
      </header>
    </main>
  );
}
