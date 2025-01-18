var k = Object.defineProperty;
var J = (s, t, e) => t in s ? k(s, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : s[t] = e;
var d = (s, t, e) => J(s, typeof t != "symbol" ? t + "" : t, e);
import u from "path";
import { existsSync as f, promises as r } from "fs";
import v from "read-excel-file/node";
import O from "write-excel-file/node";
import N from "chokidar";
function g(s) {
  if (s.length === 0 || "id" in s[0]) return;
  const t = Object.keys(s[0]);
  if (t.length < 2)
    throw new Error("Not enough columns to generate id");
  const [e, i] = t;
  for (const n of s)
    n.id = `${n[e]}---${n[i]}`;
}
function F(s) {
  for (const t of Object.keys(s))
    if (t.endsWith("_id")) return s[t];
  return null;
}
function W(s, t, e, i) {
  const n = [];
  if (i.startsWith("__") || s.length === 0 && t.length === 0)
    return n;
  g(s), g(t);
  const o = new Map(
    s.map((_) => [_.id, _])
  ), a = new Map(
    t.map((_) => [_.id, _])
  );
  let l = [];
  s.length === 0 ? l = Object.keys(t[0]) : t.length === 0 ? l = Object.keys(s[0]) : l = Array.from(
    /* @__PURE__ */ new Set([...Object.keys(s[0]), ...Object.keys(t[0])])
  );
  const c = new Set(o.keys()), h = new Set(a.keys()), S = [...h].filter((_) => !c.has(_)), $ = [...c].filter((_) => !h.has(_)), x = [...c].filter((_) => h.has(_)), w = [];
  for (const _ of x) {
    const m = o.get(_), y = a.get(_);
    for (const p of l) {
      if (p === "id") continue;
      const b = p in m ? m[p] : null, j = p in y ? y[p] : null;
      b !== j && ([null, void 0, ""].includes(b) && [null, void 0, ""].includes(j) || w.push({ entity_id: _, variable: p, old_value: b, new_value: j }));
    }
  }
  for (const _ of S)
    n.push({
      timestamp: e,
      type: "add",
      entity: i,
      entity_id: _,
      parent_entity_id: null,
      variable: null,
      old_value: null,
      new_value: null,
      name: null
    });
  for (const _ of $) {
    const m = o.get(_);
    n.push({
      timestamp: e,
      type: "delete",
      entity: i,
      entity_id: _,
      parent_entity_id: F(m),
      variable: null,
      old_value: null,
      new_value: null,
      name: m.name || null
    });
  }
  for (const _ of w)
    n.push({
      timestamp: e,
      type: "update",
      entity: i,
      entity_id: _.entity_id,
      parent_entity_id: null,
      variable: _.variable,
      old_value: _.old_value,
      new_value: _.new_value,
      name: null
    });
  return n;
}
const M = [
  {
    column: "timestamp",
    type: Number,
    value: (s) => s.timestamp
  },
  {
    column: "type",
    type: String,
    value: (s) => s.type
  },
  {
    column: "entity",
    type: String,
    value: (s) => String(s.entity)
  },
  {
    column: "entity_id",
    type: String,
    value: (s) => String(s.entity_id)
  },
  {
    column: "parent_entity_id",
    type: String,
    value: (s) => String(s.parent_entity_id)
  },
  {
    column: "variable",
    type: String,
    value: (s) => String(s.variable)
  },
  {
    column: "old_value",
    type: String,
    value: (s) => String(s.old_value)
  },
  {
    column: "new_value",
    type: String,
    value: (s) => String(s.new_value)
  },
  {
    column: "name",
    type: String,
    value: (s) => String(s.name)
  }
];
class D {
  constructor(t = {}) {
    d(this, "input_db");
    d(this, "output_db");
    d(this, "readable");
    d(this, "extension");
    d(this, "metadata_filename", "__meta__.json.js");
    d(this, "metadata_file");
    d(this, "update_db_timestamp");
    d(this, "new_evo_entries");
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
    this.set_input_db(t), N.watch(this.input_db, {
      ignored: /(^|[\/\\])\~\$/,
      persistent: !0,
      ignoreInitial: !0
    }).on("all", (e, i) => {
      if (i.includes("evolution.xlsx")) return !1;
      this.update_db(t);
    }), console.log("Jsonjsdb watching changes in", this.input_db);
  }
  async update_preview(t, e) {
    const i = u.resolve(e), n = u.join(this.output_db, t);
    f(n) || await r.mkdir(n);
    const o = await r.readdir(i);
    for (const a of o) {
      if (!a.endsWith(`.${this.extension}`) || a.startsWith("~$")) continue;
      const l = u.join(i, a), c = await v(l), h = a.split(".")[0];
      this.write_table(c, n, h);
    }
  }
  async set_output_db(t) {
    this.output_db = await this.ensure_output_db(u.resolve(t)), this.metadata_file = u.join(this.output_db, this.metadata_filename);
  }
  get_output_db() {
    return this.output_db;
  }
  get_metadata_file() {
    return this.metadata_file;
  }
  set_input_db(t) {
    this.input_db = u.resolve(t);
  }
  async get_input_metadata(t) {
    try {
      const e = await r.readdir(t), i = [];
      for (const n of e) {
        if (!n.endsWith(`.${this.extension}`) || n.startsWith("~$")) continue;
        const o = u.join(t, n), a = await r.stat(o), l = n.split(".")[0], c = Math.round(a.mtimeMs / 1e3);
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
      (o) => o.isFile() && o.name.endsWith(".json.js")
    ).length > 0) return t;
    const n = e.filter((o) => o.isDirectory());
    return n.length !== 1 ? t : t = u.join(t, n[0].name);
  }
  async delete_old_files(t) {
    const e = [], i = this.metadata_list_to_object(t), n = await r.readdir(this.output_db);
    for (const o of n) {
      const a = o.split(".")[0];
      if (!o.endsWith(".json.js") || o === "__meta__.json.js" || a in i || a === "evolution") continue;
      const l = u.join(this.output_db, o);
      console.log(`Jsonjsdb: deleting ${a}`), e.push(r.unlink(l));
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
    for (const { name: o, last_modif: a } of t)
      o in i && i[o] >= a || o !== "evolution" && n.push(this.update_table(o));
    return this.new_evo_entries = [], await Promise.all(n), n.length > 0;
  }
  async save_evolution(t) {
    const e = u.join(this.output_db, "evolution.json.js"), i = u.join(this.input_db, "evolution.xlsx");
    if (this.new_evo_entries.length > 0) {
      let n = [];
      if (f(i)) {
        const a = await v(i);
        n = this.convert_to_list_of_objects(a);
      }
      n.push(...this.new_evo_entries);
      const o = this.convert_to_list_of_lists(n);
      this.write_table(o, this.output_db, "evolution"), await O(n, { schema: M, filePath: i });
    }
    if (f(e)) {
      let n = !1;
      for (const o of t)
        o.name === "evolution" && (n = !0, o.last_modif = this.update_db_timestamp);
      n || t.push({
        name: "evolution",
        last_modif: this.update_db_timestamp
      });
    }
  }
  async update_table(t) {
    const e = u.join(this.input_db, `${t}.xlsx`), i = await v(e);
    await this.add_new_evo_entries(t, i), await this.write_table(i, this.output_db, t), console.log(`Jsonjsdb updating ${t}`);
  }
  async add_new_evo_entries(t, e) {
    const i = await this.read_jsonjs(
      u.join(this.output_db, `${t}.json.js`)
    ), n = W(
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
      const a = this.convert_to_list_of_objects(t);
      n += JSON.stringify(a, null, 2);
    } else
      n += JSON.stringify(t);
    const o = u.join(e, `${i}.json.js`);
    await r.writeFile(o, n, "utf-8");
  }
  convert_to_list_of_objects(t) {
    const e = t[0], i = [];
    for (const n of t.slice(1)) {
      const o = {};
      for (const [a, l] of e.entries())
        o[l] = n[a];
      i.push(o);
    }
    return i;
  }
  convert_to_list_of_lists(t) {
    if (t.length === 0) return [];
    const e = Object.keys(t[0]), i = [e];
    for (const n of t) {
      const o = e.map((a) => n[a]);
      i.push(o);
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
class E {
  constructor() {
    d(this, "output_db");
    d(this, "jdb_editor");
    this.output_db = "", this.jdb_editor = new D();
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
      const o = await r.readFile(`${e}/${n}`, "utf8"), a = n.split(".md")[0], l = `${this.output_db}/${t}/${a}.json.js`, c = JSON.stringify([{ content: o }]), h = `jsonjs.data["${a}"] = 
` + c;
      await r.writeFile(l, h, "utf8");
    }
  }
}
const X = new E();
function q(s) {
  return {
    name: "jsonjsdb_add_config",
    transformIndexHtml: {
      order: "post",
      handler: async (t) => t + `
` + await r.readFile(s, "utf8")
    }
  };
}
export {
  D as Jsonjsdb_editor,
  X as Jsonjsdb_watcher,
  q as jsonjsdb_add_config
};
