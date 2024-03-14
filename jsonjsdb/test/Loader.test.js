describe("Loader", () => {
  const db_key = "gdf9898fds"
  const path = "db/" + db_key
  let loader
  beforeEach(async () => {
    const db = new Jsonjsdb({ db_key })
    loader = db.loader
  })

  describe("load_jsonjs()", () => {
    it("should load records without throwing an error", async () => {
      const users = await loader.load_jsonjs(path, "user")
      expect(users).to.be.an("array").that.is.not.empty
      expect(users[0]).to.have.property("id")
    })
  })

  describe("load()", () => {
    it("should load db tables", async () => {
      await loader.load(path)
      expect(loader.db).to.be.an("object").that.is.not.empty
    })

    it("should load db tables with cache", async () => {
      await loader.load(path, use_cache = true)
      expect(loader.db).to.be.an("object").that.is.not.empty
    })
  })

  describe("add_meta()", () => {
    it("should add metadata", async () => {
      await loader.load(path)
      await loader.add_meta()
      expect(loader.db).to.have.property("metaFolder")
      expect(loader.db).to.have.property("metaDataset")
      expect(loader.db).to.have.property("metaVariable")
    })
  })
})
