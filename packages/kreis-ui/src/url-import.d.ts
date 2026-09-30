// Vite liefert bei `?url` die Adresse der Datei im Bau.
declare module "*?url" {
  const adresse: string
  export default adresse
}

// Vite baut bei `?worker` einen eigenen Worker und gibt seinen Bauplan.
declare module "*?worker" {
  const Bauplan: new () => Worker
  export default Bauplan
}
