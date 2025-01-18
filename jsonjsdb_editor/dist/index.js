var O = Object.defineProperty;
var x = (a, t, e) => t in a ? O(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var u = (a, t, e) => x(a, typeof t != "symbol" ? t + "" : t, e);
import d from "path";
import { existsSync as f, promises as r } from "fs";
import y from "read-excel-file/node";
import S from "chokidar";
function g(a) {
  if (a.length === 0 || "id" in a[0]) return;
  const t = Object.keys(a[0]);
  if (t.length < 2)
    throw new Error("Not enough columns to generate id");
  const [e, i] = t;
  for (const n of a)
    n.id = `${n[e]}---${n[i]}`;
}
function N(a) {
  for (const t of Object.keys(a))
    if (t.endsWith("_id")) return a[t];
  return null;
}
function F(a, t, e, i) {
  const n = [];
  if (i.startsWith("__") || a.length === 0 && t.length === 0)
    return n;
  g(a), g(t);
  const s = new Map(
    a.map((o) => [o.id, o])
  ), _ = new Map(
    t.map((o) => [o.id, o])
  );
  let l = [];
  a.length === 0 ? l = Object.keys(t[0]) : t.length === 0 ? l = Object.keys(a[0]) : l = Array.from(
    /* @__PURE__ */ new Set([...Object.keys(a[0]), ...Object.keys(t[0])])
  );
  const c = new Set(s.keys()), h = new Set(_.keys()), $ = [...h].filter((o) => !c.has(o)), k = [...c].filter((o) => !h.has(o)), J = [...c].filter((o) => h.has(o)), w = [];
  for (const o of J) {
    const m = s.get(o), v = _.get(o);
    for (const p of l) {
      if (p === "id") continue;
      const b = p in m ? m[p] : null, j = p in v ? v[p] : null;
      b !== j && ([null, void 0, ""].includes(b) && [null, void 0, ""].includes(j) || w.push({ entity_id: o, variable: p, old_value: b, new_value: j }));
    }
  }
  for (const o of $)
    n.push({
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
    const m = s.get(o);
    n.push({
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
    n.push({
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
  return n;
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
    u(this, "new_evo_entries");
    this.input_db = "", this.output_db = "", this.metadata_file = "", this.readable = t.readable ?? !1, this.extension = "xlsx", this.update_db_timestamp = 0, this.new_evo_entries = [];
  }
  async update_db(t) {
    if (this.set_input_db(t), !f(this.input_db)) {
      console.error(`Jsonjsdb: input db folder doesn't exist: ${this.input_db}`);
      return;
    }
    this.update_db_timestamp = Math.round(Date.now() / 1e3);
    const [e, i] = await Promise.all([
      this.get_input_metadata(this.input_db),
      this.get_output_metadata()
    ]);
    await this.delete_old_files(e), await this.update_tables(e, i), await this.save_evolution(e), await this.save_metadata(e, i);
  }
  watch_db(t) {
    this.set_input_db(t), S.watch(this.input_db, {
      ignored: /(^|[\/\\])\~\$/,
      persistent: !0,
      ignoreInitial: !0
    }).on("all", (e, i) => this.update_db(t)), console.log("Jsonjsdb watching changes in", this.input_db);
  }
  async update_preview(t, e) {
    const i = d.resolve(e), n = d.join(this.output_db, t);
    f(n) || await r.mkdir(n);
    const s = await r.readdir(i);
    for (const _ of s) {
      if (!_.endsWith(`.${this.extension}`) || _.startsWith("~$")) continue;
      const l = d.join(i, _), c = await y(l), h = _.split(".")[0];
      this.write_table(c, n, h);
    }
  }
  async set_output_db(t) {
    this.output_db = await this.ensure_output_db(d.resolve(t)), this.metadata_file = d.join(this.output_db, this.metadata_filename);
  }
  get_output_db() {
    return this.output_db;
  }
  get_metadata_file() {
    return this.metadata_file;
  }
  set_input_db(t) {
    this.input_db = d.resolve(t);
  }
  async get_input_metadata(t) {
    try {
      const e = await r.readdir(t), i = [];
      for (const n of e) {
        if (!n.endsWith(`.${this.extension}`) || n.startsWith("~$")) continue;
        const s = d.join(t, n), _ = await r.stat(s), l = n.split(".")[0], c = Math.round(_.mtimeMs / 1e3);
        i.push({ name: l, last_modif: c });
      }
      return i;
    } catch (e) {
      return console.error("Jsonjsdb: get_files_last_modif error:", e), [];
    }
  }
  async get_output_metadata() {
    let t = [];
    if (f(this.metadata_file)) {
      const e = await r.readFile(this.metadata_file, "utf-8");
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
    if (!f(t))
      return await r.mkdir(t), t;
    const e = await r.readdir(t, { withFileTypes: !0 });
    if (e.filter(
      (s) => s.isFile() && s.name.endsWith(".json.js")
    ).length > 0) return t;
    const n = e.filter((s) => s.isDirectory());
    return n.length !== 1 ? t : t = d.join(t, n[0].name);
  }
  async delete_old_files(t) {
    const e = [], i = this.metadata_list_to_object(t), n = await r.readdir(this.output_db);
    for (const s of n) {
      const _ = s.split(".")[0];
      if (!s.endsWith(".json.js") || s === "__meta__.json.js" || _ in i || _ === "evolution") continue;
      const l = d.join(this.output_db, s);
      console.log(`Jsonjsdb: deleting ${_}`), e.push(r.unlink(l));
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
    }), i += JSON.stringify(t, null, 2), await r.writeFile(this.metadata_file, i, "utf-8");
  }
  async update_tables(t, e) {
    const i = this.metadata_list_to_object(e), n = [];
    for (const { name: s, last_modif: _ } of t)
      s in i && i[s] >= _ || n.push(this.update_table(s));
    return this.new_evo_entries = [], await Promise.all(n), n.length > 0;
  }
  async save_evolution(t) {
    const e = d.join(this.output_db, "evolution.json.js");
    if (this.new_evo_entries.length > 0) {
      let i = [];
      f(e) && (i = await this.read_jsonjs(e)), i.push(...this.new_evo_entries);
      const n = this.convert_to_list_of_lists(i);
      this.write_table(n, this.output_db, "evolution");
    }
    if (f(e)) {
      let i = !1;
      for (const n of t)
        n.name === "evolution" && (i = !0, n.last_modif = this.update_db_timestamp);
      i || t.push({
        name: "evolution",
        last_modif: this.update_db_timestamp
      });
    }
  }
  async update_table(t) {
    const e = d.join(this.input_db, `${t}.xlsx`), i = await y(e);
    await this.add_new_evo_entries(t, i), await this.write_table(i, this.output_db, t), console.log(`Jsonjsdb updating ${t}`);
  }
  async add_new_evo_entries(t, e) {
    const i = await this.read_jsonjs(
      d.join(this.output_db, `${t}.json.js`)
    ), n = F(
      i,
      this.convert_to_list_of_objects(e),
      this.update_db_timestamp,
      t
    );
    this.new_evo_entries.push(...n);
  }
  async write_table(t, e, i) {
    let n = `jsonjs.data['${i}'] = 
`;
    if (this.readable) {
      const _ = this.convert_to_list_of_objects(t);
      n += JSON.stringify(_, null, 2);
    } else
      n += JSON.stringify(t);
    const s = d.join(e, `${i}.json.js`);
    await r.writeFile(s, n, "utf-8");
  }
  convert_to_list_of_objects(t) {
    const e = t[0], i = [];
    for (const n of t.slice(1)) {
      const s = {};
      for (const [_, l] of e.entries())
        s[l] = n[_];
      i.push(s);
    }
    return i;
  }
  convert_to_list_of_lists(t) {
    if (t.length === 0) return [];
    const e = Object.keys(t[0]), i = [e];
    for (const n of t) {
      const s = e.map((_) => n[_]);
      i.push(s);
    }
    return i;
  }
  async read_jsonjs(t) {
    if (!f(t)) return [];
    const e = await r.readFile(t, "utf8"), i = e.slice(e.indexOf(`
`) + 1), n = JSON.parse(i);
    return n.length > 0 && Array.isArray(n[0]) ? this.convert_to_list_of_objects(n) : n;
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
    if (!f(e)) return;
    const i = await r.readdir(e);
    for (const n of i) {
      if (!n.endsWith(".md")) continue;
      const s = await r.readFile(`${e}/${n}`, "utf8"), _ = n.split(".md")[0], l = `${this.output_db}/${t}/${_}.json.js`, c = JSON.stringify([{ content: s }]), h = `jsonjs.data["${_}"] = 
` + c;
      await r.writeFile(l, h, "utf8");
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
` + await r.readFile(a, "utf8")
    }
  };
}
export {
  W as Jsonjsdb_editor,
  H as Jsonjsdb_watcher,
  T as jsonjsdb_add_config
};
