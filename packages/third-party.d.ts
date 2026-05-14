// Ambient declarations for upstream Excalidraw runtime deps where the
// installed npm package ships types but its `exports` map omits the
// "types" condition — so TS's bundler-mode resolver can't find them.
// These re-declare just the surface Excalidraw's source touches.

declare module "browser-fs-access" {
  export interface CoreFileOptions {
    extensions?: string[];
    description?: string;
    mimeTypes?: string[];
  }

  export interface FirstCoreFileOptions extends CoreFileOptions {
    startIn?: unknown;
    id?: string;
    excludeAcceptAllOption?: boolean;
  }

  export interface FirstFileOpenOptions<M extends boolean | undefined>
    extends FirstCoreFileOptions {
    multiple?: M;
    legacySetup?: (
      resolve: (value: File | File[]) => void,
      // The second arg is the internal rejection handler. browser-fs-access
      // returns it through the cleanup function (third level of nesting),
      // so we keep it untyped from the consumer's POV.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rejectionHandler: any,
      input: HTMLInputElement,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => ((rejectPromise: any) => void) | void;
  }

  export interface FirstFileSaveOptions extends FirstCoreFileOptions {
    fileName?: string;
    suggestedName?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    legacySetup?: (
      resolve: (value: null) => void,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rejectionHandler: any,
      anchor: HTMLAnchorElement,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => ((rejectPromise: any) => void) | void;
  }

  /**
   * Returned by `fileOpen()`. The `handle` property exists only when the
   * File System Access API path is taken (Chromium-ish). On Safari /
   * Firefox the legacy `<input type="file">` path is used and `handle`
   * is undefined.
   */
  export interface FileWithHandle extends File {
    handle?: FileSystemFileHandle;
  }

  export interface FileWithDirectoryAndFileHandle extends File {
    directoryHandle?: FileSystemDirectoryHandle;
    handle?: FileSystemFileHandle;
  }

  export function fileOpen<M extends boolean | undefined = false>(
    options?: FirstFileOpenOptions<M>,
  ): Promise<M extends true ? FileWithHandle[] : FileWithHandle>;

  export function fileSave(
    blobOrPromiseBlob: Blob | Promise<Blob>,
    options?: FirstFileSaveOptions,
    existingHandle?: FileSystemFileHandle | null,
    throwIfExistingHandleNotGood?: boolean,
  ): Promise<FileSystemFileHandle | null>;

  export function directoryOpen(
    options?: FirstCoreFileOptions & { recursive?: boolean; skipDirectory?: (entry: FileSystemDirectoryHandle | { name: string }) => boolean },
  ): Promise<FileWithDirectoryAndFileHandle[]>;

  /** Constant, not a function. The File System Access API guard. */
  export const supported: boolean;

  export function imageToBlob(img: HTMLImageElement): Promise<Blob>;
}
