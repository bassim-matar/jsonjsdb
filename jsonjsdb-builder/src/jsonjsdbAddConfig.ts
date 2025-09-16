import { promises as fs } from 'fs'
import { type PluginOption } from 'vite'

export function jsonjsdbAddConfig(config: string): PluginOption {
  return {
    name: 'jsonjsdbAddConfig',
    transformIndexHtml: {
      order: 'post',
      handler: async (html: string) => {
        return html + '\n' + (await fs.readFile(config, 'utf8'))
      },
    },
  }
}
