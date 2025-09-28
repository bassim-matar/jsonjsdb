import ldb from 'localdata'
import AES from 'crypto-js/aes'
import ENC from 'crypto-js/enc-utf8'

interface LdbEntry {
  k: string
  v: string
}

interface LocalData {
  getAll(callback: (entries: unknown) => void): void
  get(key: string, callback: (data: string) => void): void
  set(key: string, data: unknown, callback?: () => void): void
  clear(): void
}

class FileProtocolEncryption {
  private browserKey: string
  private crypto: typeof AES

  constructor(browserKey: string) {
    this.browserKey = browserKey
    this.crypto = AES
  }

  encrypt(data: string): string {
    return this.crypto.encrypt(data, this.browserKey).toString()
  }

  decrypt(data: string): string {
    return this.crypto.decrypt(data, this.browserKey).toString(ENC)
  }
}

export default class DBrowser {
  private encryption: FileProtocolEncryption
  private ldb: LocalData
  private namespaced: (key: string) => string
  private useEncryption: boolean

  constructor(browserKey: string, appName: string, useEncryption: boolean) {
    this.encryption = new FileProtocolEncryption(browserKey)
    this.ldb = ldb
    this.namespaced = key => appName + '/' + key
    this.useEncryption = useEncryption && Boolean(browserKey)
  }

  private tryParseJson(maybeJson: string): unknown {
    try {
      return JSON.parse(maybeJson)
    } catch {
      return maybeJson
    }
  }

  private tryDecrypt(data: string): string {
    try {
      return this.encryption.decrypt(data)
    } catch {
      return data
    }
  }

  getAll(key: string, callback: (data: Record<string, unknown>) => void): void {
    const prefix = this.namespaced(key)
    const data: Record<string, unknown> = {}
    this.ldb.getAll((entries: unknown) => {
      const entriesArray = entries as LdbEntry[]
      for (const entry of entriesArray) {
        if (!entry.k.startsWith(prefix)) continue
        let dataEntry: unknown = entry.v
        if (this.useEncryption) {
          dataEntry = this.tryParseJson(this.tryDecrypt(dataEntry as string))
        }
        const keySuffix = entry.k.substring(prefix.length)
        if (keySuffix) {
          data[keySuffix] = dataEntry
        }
      }
      callback(data)
    })
  }

  get(key: string): Promise<unknown> {
    return new Promise(resolve => {
      this.ldb.get(this.namespaced(key), data => {
        let result: unknown = data
        if (this.useEncryption) {
          result = this.tryParseJson(this.tryDecrypt(data))
        }
        resolve(result)
      })
    })
  }

  set(key: string, data: unknown, callback?: () => void): void {
    let processedData: unknown
    if (this.useEncryption) {
      processedData = this.encryption.encrypt(JSON.stringify(data))
    } else {
      processedData = data
    }
    this.ldb.set(this.namespaced(key), processedData, callback)
  }

  clear(): void {
    this.ldb.clear()
  }
}
