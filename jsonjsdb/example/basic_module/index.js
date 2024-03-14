import Jsonjsdb from "jsonjsdb"

const db = new Jsonjsdb()
db.init().then(() => {
  const users = db.get_all("user")
  console.log(users)
})
