describe("jsonjsdb", () => {
  it("should exist", () => expect(db).to.exist)

  describe("init()", () => {
    it("should work", async () => {
      const db_init = await db.init()
      assert.notEqual(db_init, false, "db.init() return false")
    })
  })

  describe("init({ filter })", () => {
    it("should work with filter", async () => {
      const filter = {
        entity: "user",
        variable: "name",
        values: ["user 1", "user 3"],
      }
      const db_init = await db.init({ filter })
      assert.notEqual(db_init, false, "db.init() return false")
    })
  })

  describe("load()", () => {
    it("should load records", async () => {
      const users = await db.load("", "user")
      expect(users).to.be.an("array").that.is.not.empty
      expect(users[0]).to.have.property("id")
    })
  })

  describe("after init done", () => {
    before(async () => {
      await db.init()
    })

    describe("get()", () => {
      it("should get a user by id", () => {
        const user = db.get("user", 1)
        expect(user).to.have.property("id", 1)
      })
      it("should return undefined for nonexistent table", () => {
        const result = db.get("nonexistent_table", 1)
        expect(result).to.be.undefined
      })

      it("should return undefined for nonexistent id", () => {
        const result = db.get("user", 999)
        expect(result).to.be.undefined
      })
    })

    describe("get_all()", () => {
      it("should run without error", () => {
        expect(() => db.get_all("user2")).to.not.throw()
      })
      it("should return empty array for nonexistent table", () => {
        const result = db.get_all("nonexistent_table")
        expect(result).to.be.an("array").that.is.empty
      })
      it("should return 2 records when limit is 2", () => {
        const result = db.get_all("user", null, { limit: 2 })
        expect(result).to.have.lengthOf(2)
      })
      it("should work if an id is passed", () => {
        const result = db.get_all("email", { user: 1 })
        expect(result[0]).to.have.property("name")
      })
      it("should work if an object is passed", () => {
        const user = { id: 1 }
        const result = db.get_all("email", { user })
        expect(result[0]).to.have.property("name")
      })
    })

    describe("foreach()", () => {
      it("should run a callback for every row", () => {
        db.foreach("user", user => {
          expect(user).to.have.property("id")
        })
      })
    })

    describe("table_has_id()", () => {
      it("should return false for nonexistent entity", () => {
        const result = db.table_has_id("nonexistent_entity", 1)
        expect(result).to.be.false
      })

      it("should return false for nonexistent id", () => {
        const result = db.table_has_id("user", 999)
        expect(result).to.be.false
      })
    })

    describe("get_config()", () => {
      it("should return undefined for nonexistent id", () => {
        const result = db.get_config("nonexistent_id")
        expect(result).to.be.undefined
      })
    })
  })
})
