import u from "path";
import { existsSync as c, promises as r } from "fs";
import v from "read-excel-file/node";
import k from "write-excel-file/node";
import J from "chokidar";
function g(s) {
  if (s.length === 0 || "id" in s[0]) return;
  const t = Object.keys(s[0]);
  if (t.length < 2)
    throw new Error("Not enough columns to generate id");
  const [e, n] = t;
  for (const i of s)
    i.id = `${i[e]}---${i[n]}`;
}
function O(s) {
  for (const t of Object.keys(s))
    if (t.endsWith("_id")) return s[t];
  return null;
}
function N(s, t, e, n) {
  const i = [];
  if (n.startsWith("__") || s.length === 0 && t.length === 0)
    return i;
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
  const d = new Set(o.keys()), f = new Set(a.keys()), x = [...f].filter((_) => !d.has(_)), S = [...d].filter((_) => !f.has(_)), $ = [...d].filter((_) => f.has(_)), w = [];
  for (const _ of $) {
    const p = o.get(_), y = a.get(_);
    for (const h of l) {
      if (h === "id") continue;
      const m = h in p ? p[h] : null, j = h in y ? y[h] : null;
      m !== j && ([null, void 0, ""].includes(m) && [null, void 0, ""].includes(j) || w.push({ entity_id: _, variable: h, old_value: m, new_value: j }));
    }
  }
  for (const _ of x)
    i.push({
      timestamp: e,
      type: "add",
      entity: n,
      entity_id: _,
      parent_entity_id: null,
      variable: null,
      old_value: null,
      new_value: null,
      name: null
    });
  for (const _ of S) {
    const p = o.get(_);
    i.push({
      timestamp: e,
      type: "delete",
      entity: n,
      entity_id: _,
      parent_entity_id: O(p),
      variable: null,
      old_value: null,
      new_value: null,
      name: p.name || null
    });
  }
  for (const _ of w)
    i.push({
      timestamp: e,
      type: "update",
      entity: n,
      entity_id: _.entity_id,
      parent_entity_id: null,
      variable: _.variable,
      old_value: _.old_value,
      new_value: _.new_value,
      name: null
    });
  return i;
}
const b = "__table__", F = [
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
    value: (s) => String(s.entity_id || "")
  },
  {
    column: "parent_entity_id",
    type: String,
    value: (s) => String(s.parent_entity_id || "")
  },
  {
    column: "variable",
    type: String,
    value: (s) => String(s.variable || "")
  },
  {
    column: "old_value",
    type: String,
    value: (s) => String(s.old_value || "")
  },
  {
    column: "new_value",
    type: String,
    value: (s) => String(s.new_value || "")
  },
  {
    column: "name",
    type: String,
    value: (s) => String(s.name || "")
  }
];
class W {
  input_db;
  output_db;
  readable;
  extension;
  table_index_filename = `${b}.json.js`;
  table_index_file;
  update_db_timestamp;
  new_evo_entries;
  constructor(t = {}) {
    this.input_db = "", this.output_db = "", this.table_index_file = "", this.readable = t.readable ?? !1, this.extension = "xlsx", this.update_db_timestamp = 0, this.new_evo_entries = [];
  }
  async update_db(t) {
    if (this.set_input_db(t), !c(this.input_db)) {
      console.error(`Jsonjsdb: input db folder doesn't exist: ${this.input_db}`);
      return;
    }
    this.update_db_timestamp = Math.round(Date.now() / 1e3);
    const [e, n] = await Promise.all([
      this.get_input_metadata(this.input_db),
      this.get_output_metadata()
    ]);
    await this.delete_old_files(e), await this.update_tables(e, n), await this.save_evolution(e), await this.save_metadata(e, n);
  }
  watch_db(t) {
    this.set_input_db(t), J.watch(this.input_db, {
      ignored: /(^|[\/\\])\~\$/,
      persistent: !0,
      ignoreInitial: !0
    }).on("all", (e, n) => {
      if (n.includes("evolution.xlsx")) return !1;
      this.update_db(t);
    }), console.log("Jsonjsdb watching changes in", this.input_db);
  }
  async update_preview(t, e) {
    const n = u.resolve(e), i = u.join(this.output_db, t);
    c(i) || await r.mkdir(i);
    const o = await r.readdir(n);
    for (const a of o) {
      if (!a.endsWith(`.${this.extension}`) || a.startsWith("~$")) continue;
      const l = u.join(n, a), d = await v(l), f = a.split(".")[0];
      this.write_table(d, i, f);
    }
  }
  async set_output_db(t) {
    this.output_db = await this.ensure_output_db(u.resolve(t)), this.table_index_file = u.join(this.output_db, this.table_index_filename);
  }
  get_output_db() {
    return this.output_db;
  }
  get_table_index_file() {
    return this.table_index_file;
  }
  set_input_db(t) {
    this.input_db = u.resolve(t);
  }
  async get_input_metadata(t) {
    try {
      const e = await r.readdir(t), n = [];
      for (const i of e) {
        if (!i.endsWith(`.${this.extension}`) || i.startsWith("~$")) continue;
        const o = u.join(t, i), a = await r.stat(o), l = i.split(".")[0], d = Math.round(a.mtimeMs / 1e3);
        n.push({ name: l, last_modif: d });
      }
      return n;
    } catch (e) {
      return console.error("Jsonjsdb: get_files_last_modif error:", e), [];
    }
  }
  async get_output_metadata() {
    let t = [];
    if (c(this.table_index_file)) {
      const e = await r.readFile(this.table_index_file, "utf-8");
      try {
        const n = e.split(`
`);
        n.shift(), t = JSON.parse(n.join(`
`));
      } catch (n) {
        console.error(`Jsonjsdb: error reading ${this.table_index_file}: ${n}`);
      }
    }
    return t;
  }
  metadata_list_to_object(t) {
    return t.reduce((e, n) => (e[n.name] = n.last_modif, e), {});
  }
  async ensure_output_db(t) {
    if (!c(t))
      return await r.mkdir(t), t;
    const e = await r.readdir(t, { withFileTypes: !0 });
    if (e.filter(
      (o) => o.isFile() && o.name.endsWith(".json.js")
    ).length > 0) return t;
    const i = e.filter((o) => o.isDirectory());
    return i.length !== 1 ? t : t = u.join(t, i[0].name);
  }
  async delete_old_files(t) {
    const e = [], n = this.metadata_list_to_object(t), i = await r.readdir(this.output_db);
    for (const o of i) {
      const a = o.split(".")[0];
      if (!o.endsWith(".json.js") || o === `${b}.json.js` || a in n || a === "evolution") continue;
      const l = u.join(this.output_db, o);
      console.log(`Jsonjsdb: deleting ${a}`), e.push(r.unlink(l));
    }
    return await Promise.all(e), e.length > 0;
  }
  async save_metadata(t, e) {
    if (e = e.filter((i) => i.name !== b), JSON.stringify(t) === JSON.stringify(e))
      return;
    let n = `jsonjs.data['${b}'] = 
`;
    t.push({
      name: b,
      last_modif: Math.round(Date.now() / 1e3)
    }), n += JSON.stringify(t, null, 2), await r.writeFile(this.table_index_file, n, "utf-8");
  }
  async update_tables(t, e) {
    const n = this.metadata_list_to_object(e), i = [];
    for (const { name: o, last_modif: a } of t)
      o in n && n[o] >= a || o !== "evolution" && i.push(this.update_table(o));
    return this.new_evo_entries = [], await Promise.all(i), i.length > 0;
  }
  async save_evolution(t) {
    const e = u.join(this.output_db, "evolution.json.js"), n = u.join(this.input_db, "evolution.xlsx");
    if (this.new_evo_entries.length > 0) {
      let i = [];
      if (c(n)) {
        const a = await v(n);
        i = this.convert_to_list_of_objects(a);
      }
      i.push(...this.new_evo_entries);
      const o = this.convert_to_list_of_lists(i);
      this.write_table(o, this.output_db, "evolution"), await k(i, { schema: F, filePath: n });
    }
    if (c(e)) {
      let i = !1;
      for (const o of t)
        o.name === "evolution" && (i = !0, this.new_evo_entries.length > 0 && (o.last_modif = this.update_db_timestamp));
      i || t.push({
        name: "evolution",
        last_modif: this.update_db_timestamp
      });
    }
  }
  async update_table(t) {
    const e = u.join(this.input_db, `${t}.xlsx`), n = await v(e);
    await this.add_new_evo_entries(t, n), await this.write_table(n, this.output_db, t), console.log(`Jsonjsdb updating ${t}`);
  }
  async add_new_evo_entries(t, e) {
    const n = await this.read_jsonjs(
      u.join(this.output_db, `${t}.json.js`)
    ), i = N(
      n,
      this.convert_to_list_of_objects(e),
      this.update_db_timestamp,
      t
    );
    this.new_evo_entries.push(...i);
  }
  async write_table(t, e, n) {
    let i = `jsonjs.data['${n}'] = 
`;
    if (this.readable) {
      const a = this.convert_to_list_of_objects(t);
      i += JSON.stringify(a, null, 2);
    } else
      i += JSON.stringify(t);
    const o = u.join(e, `${n}.json.js`);
    await r.writeFile(o, i, "utf-8");
  }
  convert_to_list_of_objects(t) {
    const e = t[0], n = [];
    for (const i of t.slice(1)) {
      const o = {};
      for (const [a, l] of e.entries())
        o[l] = i[a];
      n.push(o);
    }
    return n;
  }
  convert_to_list_of_lists(t) {
    if (t.length === 0) return [];
    const e = Object.keys(t[0]), n = [e];
    for (const i of t) {
      const o = e.map((a) => i[a]);
      n.push(o);
    }
    return n;
  }
  async read_jsonjs(t) {
    if (!c(t)) return [];
    const e = await r.readFile(t, "utf8"), n = e.slice(e.indexOf(`
`) + 1), i = JSON.parse(n);
    return i.length > 0 && Array.isArray(i[0]) ? this.convert_to_list_of_objects(i) : i;
  }
}
class E {
  output_db;
  jdb_editor;
  constructor() {
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
  get_table_index_file_path() {
    return this.jdb_editor.get_table_index_file();
  }
  async update_md_files(t, e) {
    if (!c(e)) return;
    const n = await r.readdir(e);
    for (const i of n) {
      if (!i.endsWith(".md")) continue;
      const o = await r.readFile(`${e}/${i}`, "utf8"), a = i.split(".md")[0], l = `${this.output_db}/${t}/${a}.json.js`, d = JSON.stringify([{ content: o }]), f = `jsonjs.data["${a}"] = 
` + d;
      await r.writeFile(l, f, "utf8");
    }
  }
}
const T = new E();
function X(s) {
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
  W as Jsonjsdb_editor,
  T as Jsonjsdb_watcher,
  X as jsonjsdb_add_config
};
