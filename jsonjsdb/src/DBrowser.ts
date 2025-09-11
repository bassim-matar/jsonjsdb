import ldb from "localdata"
import AES from "crypto-js/aes"
import ENC from "crypto-js/enc-utf8"

interface LdbEntry {
  k: string;
  v: any;
}

interface LocalData {
  getAll(callback: (entries: any) => void): void;
  get(key: string, callback: (data: any) => void): void;
  set(key: string, data: any, callback?: () => void): void;
  clear(): void;
}

class FileProtocolEncryption {
  private browser_key: string;
  private crypto: typeof AES;

  constructor(browser_key: string) {
    this.browser_key = browser_key
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
  private encryption: FileProtocolEncryption;
  private ldb: LocalData;
  private _namespaced: (key: string) => string;
  private use_encryption: boolean;

  constructor(browser_key: string, app_name: string, use_encryption: boolean) {
    this.encryption = new FileProtocolEncryption(browser_key)
    this.ldb = ldb
    this._namespaced = key => app_name + "/" + key
    this.use_encryption = use_encryption && Boolean(browser_key)
  }

  private _try_parse_json(maybe_json: string): any {
    try {
      return JSON.parse(maybe_json)
    } catch {
      return maybe_json
    }
  }

  private _try_decrypt(data: string): string {
    try {
      return this.encryption.decrypt(data)
    } catch {
      return data
    }
  }

  getAll(key: string, callback: (data: any[]) => void): void {
    const prefix = this._namespaced(key)
    const data: any[] = []
    this.ldb.getAll((entries: any) => {
      const entriesArray = entries as LdbEntry[]
      for (const entry of entriesArray) {
        if (!entry.k.startsWith(prefix)) continue
        let data_entry = entry.v
        if (this.use_encryption) {
          data_entry = this._try_parse_json(this._try_decrypt(data_entry))
        }
        const key_suffix = entry.k.substring(prefix.length)
        if (key_suffix) {
          data[key_suffix] = data_entry
        }
      }
      callback(data)
    })
  }

  get(key: string): Promise<any> {
    return new Promise(resolve => {
      this.ldb.get(this._namespaced(key), data => {
        if (this.use_encryption)
          data = this._try_parse_json(this._try_decrypt(data))
        resolve(data)
      })
    })
  }

  set(key: string, data: any, callback?: () => void): void {
    if (this.use_encryption) {
      data = this.encryption.encrypt(JSON.stringify(data))
    }
    this.ldb.set(this._namespaced(key), data, callback)
  }

  clear(): void {
    this.ldb.clear()
  }
}
