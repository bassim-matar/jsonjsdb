import ldb from "localdata"
import AES from "crypto-js/aes"
import ENC from "crypto-js/enc-utf8"

class FileProtocolEncryption {
  constructor(browser_key) {
    this.browser_key = browser_key
    this.crypto = AES
  }
  encrypt(data) {
    return this.crypto.encrypt(data, this.browser_key).toString()
  }
  decrypt(data) {
    return this.crypto.decrypt(data, this.browser_key).toString(ENC)
  }
}

export default class DBrowser {
  constructor(browser_key, app_name, use_encryption) {
    this.encryption = new FileProtocolEncryption(browser_key)
    this.ldb = ldb
    this._namespaced = key => app_name + "/" + key
    this.use_encryption = Boolean(browser_key)
    if (use_encryption === false) this.use_encryption = false
  }
  _try_parse_json(maybe_json) {
    try {
      return JSON.parse(maybe_json)
    } catch {
      return maybe_json
    }
  }
  _try_decrypt(data) {
    try {
      return this.encryption.decrypt(data)
    } catch {
      return data
    }
  }
  getAll(key, callback) {
    const prefix = this._namespaced(key)
    const data = []
    this.ldb.getAll(entries => {
      for (const entry of entries) {
        if (!entry.k.startsWith(prefix)) continue
        let data_entry = entry.v
        if (this.use_encryption) {
          data_entry = this._try_parse_json(this._try_decrypt(data_entry))
        }
        data[entry.k.split(prefix)[1]] = data_entry
      }
      callback(data)
    })
  }
  get(key) {
    return new Promise(resolve => {
      this.ldb.get(this._namespaced(key), data => {
        if (this.use_encryption)
          data = this._try_parse_json(this._try_decrypt(data))
        resolve(data)
      })
    })
  }
  set(key, data, callback = () => {}) {
    if (this.use_encryption) {
      data = this.encryption.encrypt(JSON.stringify(data))
    }
    this.ldb.set(this._namespaced(key), data, callback)
  }
  clear() {
    this.ldb.clear()
  }
}
