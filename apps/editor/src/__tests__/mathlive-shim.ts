// Test-only stub for mathlive. MathLive registers a custom element on
// import; tests don't render math-fields, so a no-op default export
// keeps the import-side-effect happy.

export class MathfieldElement {
  static fontsDirectory: string | null = null;
  static soundsDirectory: string | null = null;
}

export default {};
