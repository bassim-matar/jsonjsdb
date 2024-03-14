
class Simple {
  constructor(data) {
    this.data = data
  }
  publicly_visible(table_name, id) {
    const test = this.#id_to_index(table_name, id)
    return table_name + id
  }
  #id_to_index(table_name, id) {
    return table_name + id
  }
}
