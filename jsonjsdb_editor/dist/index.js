var $ = Object.defineProperty;
var J = (_, t, e) => t in _ ? $(_, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : _[t] = e;
var u = (_, t, e) => J(_, typeof t != "symbol" ? t + "" : t, e);
import l from "path";
import { existsSync as h, promises as r } from "fs";
import w from "read-excel-file/node";
import k from "chokidar";
function y(_) {
  if (_.length === 0 || "id" in _[0]) return;
  const t = Object.keys(_[0]);
  if (t.length < 2)
    throw new Error("Not enough columns to generate id");
  const [e, s] = t;
  for (const i of _)
    i.id = `${i[e]}---${i[s]}`;
}
function x(_) {
  for (const t of Object.keys(_))
    if (t.endsWith("_id")) return _[t];
  return null;
}
function O(_, t, e, s) {
  const i = [];
  if (s.startsWith("__")) return i;
  y(_), y(t);
  const n = new Map(
    _.map((o) => [o.id, o])
  ), a = new Map(
    t.map((o) => [o.id, o])
  ), d = new Set(n.keys()), c = new Set(a.keys()), m = [...c].filter((o) => !d.has(o)), g = [...d].filter((o) => !c.has(o)), v = [...d].filter((o) => c.has(o)), b = [];
  for (const o of v) {
    const f = n.get(o), j = a.get(o);
    for (const p of Object.keys(f))
      p !== "id" && f[p] !== j[p] && b.push({
        entity_id: o,
        variable: p,
        old_value: f[p],
        new_value: j[p]
      });
  }
  for (const o of m)
    i.push({
      timestamp: e,
      type: "add",
      entity: s,
      entity_id: o,
      parent_entity_id: null,
      variable: null,
      old_value: null,
      new_value: null,
      name: null
    });
  for (const o of g) {
    const f = n.get(o);
    i.push({
      timestamp: e,
      type: "delete",
      entity: s,
      entity_id: o,
      parent_entity_id: x(f),
      variable: null,
      old_value: null,
      new_value: null,
      name: f.name || null
    });
  }
  for (const o of b)
    i.push({
      timestamp: e,
      type: "update",
      entity: s,
      entity_id: o.entity_id,
      parent_entity_id: null,
      variable: o.variable,
      old_value: o.old_value,
      new_value: o.new_value,
      name: null
    });
  return i;
}
class N {
  constructor(t = {}) {
    u(this, "input_db");
    u(this, "output_db");
    u(this, "readable");
    u(this, "extension");
    u(this, "metadata_filename", "__meta__.json.js");
    u(this, "metadata_file");
    u(this, "update_db_timestamp");
    u(this, "new_history_entries");
    this.input_db = "", this.output_db = "", this.metadata_file = "", this.readable = t.readable ?? !1, this.extension = "xlsx", this.update_db_timestamp = 0, this.new_history_entries = [];
  }
  async update_db(t) {
    if (this.set_input_db(t), !h(this.input_db)) {
      console.error(`Jsonjsdb: input db folder doesn't exist: ${this.input_db}`);
      return;
    }
    this.update_db_timestamp = Math.round(Date.now() / 1e3);
    const [e, s] = await Promise.all([
      this.get_input_metadata(this.input_db),
      this.get_output_metadata()
    ]);
    await this.delete_old_files(e), await this.update_tables(e, s), await this.save_history(e), await this.save_metadata(e, s);
  }
  watch_db(t) {
    this.set_input_db(t), k.watch(this.input_db, {
      ignored: /(^|[\/\\])\~\$/,
      persistent: !0,
      ignoreInitial: !0
    }).on("all", (e, s) => this.update_db(t)), console.log("Jsonjsdb watching changes in", this.input_db);
  }
  async update_preview(t, e) {
    const s = l.resolve(e), i = l.join(this.output_db, t);
    h(i) || await r.mkdir(i);
    const n = await r.readdir(s);
    for (const a of n) {
      if (!a.endsWith(`.${this.extension}`) || a.startsWith("~$")) continue;
      const d = l.join(s, a), c = await w(d), m = a.split(".")[0];
      this.write_table(c, i, m);
    }
  }
  async set_output_db(t) {
    this.output_db = await this.ensure_output_db(l.resolve(t)), this.metadata_file = l.join(this.output_db, this.metadata_filename);
  }
  get_output_db() {
    return this.output_db;
  }
  get_metadata_file() {
    return this.metadata_file;
  }
  set_input_db(t) {
    this.input_db = l.resolve(t);
  }
  async get_input_metadata(t) {
    try {
      const e = await r.readdir(t), s = [];
      for (const i of e) {
        if (!i.endsWith(`.${this.extension}`) || i.startsWith("~$")) continue;
        const n = l.join(t, i), a = await r.stat(n), d = i.split(".")[0], c = Math.round(a.mtimeMs / 1e3);
        s.push({ name: d, last_modif: c });
      }
      return s;
    } catch (e) {
      return console.error("Jsonjsdb: get_files_last_modif error:", e), [];
    }
  }
  async get_output_metadata() {
    let t = [];
    if (h(this.metadata_file)) {
      const e = await r.readFile(this.metadata_file, "utf-8");
      try {
        const s = e.split(`
`);
        s.shift(), t = JSON.parse(s.join(`
`));
      } catch (s) {
        console.error(`Jsonjsdb: error reading ${this.metadata_file}: ${s}`);
      }
    }
    return t;
  }
  metadata_list_to_object(t) {
    return t.reduce((e, s) => (e[s.name] = s.last_modif, e), {});
  }
  async ensure_output_db(t) {
    if (!h(t))
      return await r.mkdir(t), t;
    const e = await r.readdir(t, { withFileTypes: !0 });
    if (e.filter(
      (n) => n.isFile() && n.name.endsWith(".json.js")
    ).length > 0) return t;
    const i = e.filter((n) => n.isDirectory());
    return i.length !== 1 ? t : t = l.join(t, i[0].name);
  }
  async delete_old_files(t) {
    const e = [], s = this.metadata_list_to_object(t), i = await r.readdir(this.output_db);
    for (const n of i) {
      const a = n.split(".")[0];
      if (!n.endsWith(".json.js") || n === "__meta__.json.js" || a in s || a === "history") continue;
      const d = l.join(this.output_db, n);
      console.log(`Jsonjsdb: deleting ${a}`), e.push(r.unlink(d));
    }
    return await Promise.all(e), e.length > 0;
  }
  async save_metadata(t, e) {
    if (JSON.stringify(t) === JSON.stringify(e))
      return;
    let s = `jsonjs.data['__meta__'] = 
`;
    t.push({
      name: "__meta__",
      last_modif: Math.round(Date.now() / 1e3)
    }), s += JSON.stringify(t, null, 2), await r.writeFile(this.metadata_file, s, "utf-8");
  }
  async update_tables(t, e) {
    const s = this.metadata_list_to_object(e), i = [];
    for (const { name: n, last_modif: a } of t)
      n in s && s[n] >= a || i.push(this.update_table(n));
    return this.new_history_entries = [], await Promise.all(i), i.length > 0;
  }
  async save_history(t) {
    const e = l.join(this.output_db, "history.json.js");
    if (this.new_history_entries.length > 0) {
      let s = [];
      h(e) && (s = await this.read_jsonjs(e)), s.push(...this.new_history_entries);
      const i = this.convert_to_list_of_lists(s);
      this.write_table(i, this.output_db, "history");
    }
    if (h(e)) {
      let s = !1;
      for (const i of t)
        i.name === "history" && (s = !0, i.last_modif = this.update_db_timestamp);
      s || t.push({
        name: "history",
        last_modif: this.update_db_timestamp
      });
    }
  }
  async update_table(t) {
    const e = l.join(this.input_db, `${t}.xlsx`), s = await w(e);
    await this.add_new_history_entries(t, s), await this.write_table(s, this.output_db, t), console.log(`Jsonjsdb updating ${t}`);
  }
  async add_new_history_entries(t, e) {
    const s = await this.read_jsonjs(
      l.join(this.output_db, `${t}.json.js`)
    ), i = O(
      s,
      this.convert_to_list_of_objects(e),
      this.update_db_timestamp,
      t
    );
    this.new_history_entries.push(...i);
  }
  async write_table(t, e, s) {
    let i = `jsonjs.data['${s}'] = 
`;
    if (this.readable) {
      const a = this.convert_to_list_of_objects(t);
      i += JSON.stringify(a, null, 2);
    } else
      i += JSON.stringify(t);
    const n = l.join(e, `${s}.json.js`);
    await r.writeFile(n, i, "utf-8");
  }
  convert_to_list_of_objects(t) {
    const e = t[0], s = [];
    for (const i of t.slice(1)) {
      const n = {};
      for (const [a, d] of e.entries())
        n[d] = i[a];
      s.push(n);
    }
    return s;
  }
  convert_to_list_of_lists(t) {
    if (t.length === 0) return [];
    const e = Object.keys(t[0]), s = [e];
    for (const i of t) {
      const n = e.map((a) => i[a]);
      s.push(n);
    }
    return s;
  }
  async read_jsonjs(t) {
    if (!h(t)) return [];
    const e = await r.readFile(t, "utf8"), s = e.slice(e.indexOf(`
`) + 1), i = JSON.parse(s);
    return i.length > 0 && Array.isArray(i[0]) ? this.convert_to_list_of_objects(i) : i;
  }
}
class S {
  constructor() {
    u(this, "output_db");
    u(this, "jdb_editor");
    this.output_db = "", this.jdb_editor = new N();
  }
  is_dev() {
    return process.env.NODE_ENV === "development";
  }
  async set_db(t) {
    await this.jdb_editor.set_output_db(t), this.output_db = this.jdb_editor.get_output_db();
  }
  async watch(t, e = !1) {
    await this.jdb_editor.update_db(t), (this.is_dev() || e) && this.jdb_editor.watch_db(t);
  }
  async update_preview(t, e) {
    await this.jdb_editor.update_preview(t, e);
  }
  get_db_meta_file_path() {
    return this.jdb_editor.get_metadata_file();
  }
  async update_md_files(t, e) {
    if (!h(e)) return;
    const s = await r.readdir(e);
    for (const i of s) {
      if (!i.endsWith(".md")) continue;
      const n = await r.readFile(`${e}/${i}`, "utf8"), a = i.split(".md")[0], d = `${this.output_db}/${t}/${a}.json.js`, c = JSON.stringify([{ content: n }]), m = `jsonjs.data["${a}"] = 
` + c;
      await r.writeFile(d, m, "utf8");
    }
  }
}
const P = new S();
function A(_) {
  return {
    name: "jsonjsdb_add_config",
    transformIndexHtml: {
      order: "post",
      handler: async (t) => t + `
` + await r.readFile(_, "utf8")
    }
  };
}
export {
  N as Jsonjsdb_editor,
  P as Jsonjsdb_watcher,
  A as jsonjsdb_add_config
};
