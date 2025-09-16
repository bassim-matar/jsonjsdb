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
  private browser_key: string
  private crypto: typeof AES

  constructor(browserKey: string) {
    this.browser_key = browserKey
    this.crypto = AES
  }

  encrypt(data: string): string {
    return this.crypto.encrypt(data, this.browser_key).toString()
  }

  decrypt(data: string): string {
    return this.crypto.decrypt(data, this.browser_key).toString(ENC)
  }
}

export default class DBrowser {
  private encryption: FileProtocolEncryption
  private ldb: LocalData
  private _namespaced: (key: string) => string
  private use_encryption: boolean

  constructor(browserKey: string, appName: string, useEncryption: boolean) {
    this.encryption = new FileProtocolEncryption(browserKey)
    this.ldb = ldb
    this._namespaced = key => appName + '/' + key
    this.use_encryption = useEncryption && Boolean(browserKey)
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
    const prefix = this._namespaced(key)
    const data: Record<string, unknown> = {}
    this.ldb.getAll((entries: unknown) => {
      const entriesArray = entries as LdbEntry[]
      for (const entry of entriesArray) {
        if (!entry.k.startsWith(prefix)) continue
        let dataEntry: unknown = entry.v
        if (this.use_encryption) {
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
      this.ldb.get(this._namespaced(key), data => {
        let result: unknown = data
        if (this.use_encryption) {
          result = this.tryParseJson(this.tryDecrypt(data))
        }
        resolve(result)
      })
    })
  }

  set(key: string, data: unknown, callback?: () => void): void {
    let processedData: unknown
    if (this.use_encryption) {
      processedData = this.encryption.encrypt(JSON.stringify(data))
    } else {
      processedData = data
    }
    this.ldb.set(this._namespaced(key), processedData, callback)
  }

  clear(): void {
    this.ldb.clear()
  }
}
