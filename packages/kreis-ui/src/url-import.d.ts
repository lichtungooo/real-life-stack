// Vite liefert bei `?url` die Adresse der Datei im Bau.
declare module "*?url" {
  const adresse: string
  export default adresse
}
