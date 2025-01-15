var O = Object.defineProperty;
var x = (a, t, e) => t in a ? O(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var u = (a, t, e) => x(a, typeof t != "symbol" ? t + "" : t, e);
import l from "path";
import { existsSync as h, promises as _ } from "fs";
import g from "read-excel-file/node";
import S from "chokidar";
function v(a) {
  if (a.length === 0 || "id" in a[0]) return;
  const t = Object.keys(a[0]);
  if (t.length < 2)
    throw new Error("Not enough columns to generate id");
  const [e, i] = t;
  for (const s of a)
    s.id = `${s[e]}---${s[i]}`;
}
function N(a) {
  for (const t of Object.keys(a))
    if (t.endsWith("_id")) return a[t];
  return null;
}
function F(a, t, e, i) {
  const s = [];
  if (i.startsWith("__") || a.length === 0 && t.length === 0)
    return s;
  v(a), v(t);
  const n = new Map(
    a.map((o) => [o.id, o])
  ), r = new Map(
    t.map((o) => [o.id, o])
  );
  let d = [];
  a.length === 0 ? d = Object.keys(t[0]) : t.length === 0 ? d = Object.keys(a[0]) : d = Array.from(
    /* @__PURE__ */ new Set([...Object.keys(a[0]), ...Object.keys(t[0])])
  );
  const c = new Set(n.keys()), f = new Set(r.keys()), $ = [...f].filter((o) => !c.has(o)), k = [...c].filter((o) => !f.has(o)), J = [...c].filter((o) => f.has(o)), w = [];
  for (const o of J) {
    const m = n.get(o), y = r.get(o);
    for (const p of d) {
      if (p === "id") continue;
      const b = p in m ? m[p] : null, j = p in y ? y[p] : null;
      b !== j && ([null, void 0, ""].includes(b) && [null, void 0, ""].includes(j) || w.push({ entity_id: o, variable: p, old_value: b, new_value: j }));
    }
  }
  for (const o of $)
    s.push({
      timestamp: e,
      type: "add",
      entity: i,
      entity_id: o,
      parent_entity_id: null,
      variable: null,
      old_value: null,
      new_value: null,
      name: null
    });
  for (const o of k) {
    const m = n.get(o);
    s.push({
      timestamp: e,
      type: "delete",
      entity: i,
      entity_id: o,
      parent_entity_id: N(m),
      variable: null,
      old_value: null,
      new_value: null,
      name: m.name || null
    });
  }
  for (const o of w)
    s.push({
      timestamp: e,
      type: "update",
      entity: i,
      entity_id: o.entity_id,
      parent_entity_id: null,
      variable: o.variable,
      old_value: o.old_value,
      new_value: o.new_value,
      name: null
    });
  return s;
}
class W {
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
    const [e, i] = await Promise.all([
      this.get_input_metadata(this.input_db),
      this.get_output_metadata()
    ]);
    await this.delete_old_files(e), await this.update_tables(e, i), await this.save_history(e), await this.save_metadata(e, i);
  }
  watch_db(t) {
    this.set_input_db(t), S.watch(this.input_db, {
      ignored: /(^|[\/\\])\~\$/,
      persistent: !0,
      ignoreInitial: !0
    }).on("all", (e, i) => this.update_db(t)), console.log("Jsonjsdb watching changes in", this.input_db);
  }
  async update_preview(t, e) {
    const i = l.resolve(e), s = l.join(this.output_db, t);
    h(s) || await _.mkdir(s);
    const n = await _.readdir(i);
    for (const r of n) {
      if (!r.endsWith(`.${this.extension}`) || r.startsWith("~$")) continue;
      const d = l.join(i, r), c = await g(d), f = r.split(".")[0];
      this.write_table(c, s, f);
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
      const e = await _.readdir(t), i = [];
      for (const s of e) {
        if (!s.endsWith(`.${this.extension}`) || s.startsWith("~$")) continue;
        const n = l.join(t, s), r = await _.stat(n), d = s.split(".")[0], c = Math.round(r.mtimeMs / 1e3);
        i.push({ name: d, last_modif: c });
      }
      return i;
    } catch (e) {
      return console.error("Jsonjsdb: get_files_last_modif error:", e), [];
    }
  }
  async get_output_metadata() {
    let t = [];
    if (h(this.metadata_file)) {
      const e = await _.readFile(this.metadata_file, "utf-8");
      try {
        const i = e.split(`
`);
        i.shift(), t = JSON.parse(i.join(`
`));
      } catch (i) {
        console.error(`Jsonjsdb: error reading ${this.metadata_file}: ${i}`);
      }
    }
    return t;
  }
  metadata_list_to_object(t) {
    return t.reduce((e, i) => (e[i.name] = i.last_modif, e), {});
  }
  async ensure_output_db(t) {
    if (!h(t))
      return await _.mkdir(t), t;
    const e = await _.readdir(t, { withFileTypes: !0 });
    if (e.filter(
      (n) => n.isFile() && n.name.endsWith(".json.js")
    ).length > 0) return t;
    const s = e.filter((n) => n.isDirectory());
    return s.length !== 1 ? t : t = l.join(t, s[0].name);
  }
  async delete_old_files(t) {
    const e = [], i = this.metadata_list_to_object(t), s = await _.readdir(this.output_db);
    for (const n of s) {
      const r = n.split(".")[0];
      if (!n.endsWith(".json.js") || n === "__meta__.json.js" || r in i || r === "history") continue;
      const d = l.join(this.output_db, n);
      console.log(`Jsonjsdb: deleting ${r}`), e.push(_.unlink(d));
    }
    return await Promise.all(e), e.length > 0;
  }
  async save_metadata(t, e) {
    if (JSON.stringify(t) === JSON.stringify(e))
      return;
    let i = `jsonjs.data['__meta__'] = 
`;
    t.push({
      name: "__meta__",
      last_modif: Math.round(Date.now() / 1e3)
    }), i += JSON.stringify(t, null, 2), await _.writeFile(this.metadata_file, i, "utf-8");
  }
  async update_tables(t, e) {
    const i = this.metadata_list_to_object(e), s = [];
    for (const { name: n, last_modif: r } of t)
      n in i && i[n] >= r || s.push(this.update_table(n));
    return this.new_history_entries = [], await Promise.all(s), s.length > 0;
  }
  async save_history(t) {
    const e = l.join(this.output_db, "history.json.js");
    if (this.new_history_entries.length > 0) {
      let i = [];
      h(e) && (i = await this.read_jsonjs(e)), i.push(...this.new_history_entries);
      const s = this.convert_to_list_of_lists(i);
      this.write_table(s, this.output_db, "history");
    }
    if (h(e)) {
      let i = !1;
      for (const s of t)
        s.name === "history" && (i = !0, s.last_modif = this.update_db_timestamp);
      i || t.push({
        name: "history",
        last_modif: this.update_db_timestamp
      });
    }
  }
  async update_table(t) {
    const e = l.join(this.input_db, `${t}.xlsx`), i = await g(e);
    await this.add_new_history_entries(t, i), await this.write_table(i, this.output_db, t), console.log(`Jsonjsdb updating ${t}`);
  }
  async add_new_history_entries(t, e) {
    const i = await this.read_jsonjs(
      l.join(this.output_db, `${t}.json.js`)
    ), s = F(
      i,
      this.convert_to_list_of_objects(e),
      this.update_db_timestamp,
      t
    );
    this.new_history_entries.push(...s);
  }
  async write_table(t, e, i) {
    let s = `jsonjs.data['${i}'] = 
`;
    if (this.readable) {
      const r = this.convert_to_list_of_objects(t);
      s += JSON.stringify(r, null, 2);
    } else
      s += JSON.stringify(t);
    const n = l.join(e, `${i}.json.js`);
    await _.writeFile(n, s, "utf-8");
  }
  convert_to_list_of_objects(t) {
    const e = t[0], i = [];
    for (const s of t.slice(1)) {
      const n = {};
      for (const [r, d] of e.entries())
        n[d] = s[r];
      i.push(n);
    }
    return i;
  }
  convert_to_list_of_lists(t) {
    if (t.length === 0) return [];
    const e = Object.keys(t[0]), i = [e];
    for (const s of t) {
      const n = e.map((r) => s[r]);
      i.push(n);
    }
    return i;
  }
  async read_jsonjs(t) {
    if (!h(t)) return [];
    const e = await _.readFile(t, "utf8"), i = e.slice(e.indexOf(`
`) + 1), s = JSON.parse(i);
    return s.length > 0 && Array.isArray(s[0]) ? this.convert_to_list_of_objects(s) : s;
  }
}
class M {
  constructor() {
    u(this, "output_db");
    u(this, "jdb_editor");
    this.output_db = "", this.jdb_editor = new W();
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
    const i = await _.readdir(e);
    for (const s of i) {
      if (!s.endsWith(".md")) continue;
      const n = await _.readFile(`${e}/${s}`, "utf8"), r = s.split(".md")[0], d = `${this.output_db}/${t}/${r}.json.js`, c = JSON.stringify([{ content: n }]), f = `jsonjs.data["${r}"] = 
` + c;
      await _.writeFile(d, f, "utf8");
    }
  }
}
const H = new M();
function T(a) {
  return {
    name: "jsonjsdb_add_config",
    transformIndexHtml: {
      order: "post",
      handler: async (t) => t + `
` + await _.readFile(a, "utf8")
    }
  };
}
export {
  W as Jsonjsdb_editor,
  H as Jsonjsdb_watcher,
  T as jsonjsdb_add_config
};
