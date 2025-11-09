declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): Root;
  export interface Root {
    render(children: React.ReactNode): void;
    unmount(): void;
  }
}