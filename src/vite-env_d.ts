/// <reference types="vite/client" />

declare module 'qrcode' {
  export interface QRCodeOptions {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
  }

  export function toDataURL(
    text: string,
    options?: QRCodeOptions
  ): Promise<string>
}
