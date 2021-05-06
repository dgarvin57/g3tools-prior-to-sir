const express = require("express")
const router = express.Router()
const { ItemMaster, validate } = require("../1-controllers/item-master")
const { authenticateToken } = require("../utils/auth-utils")

/* **********************************************
//  /items ROUTES: Handle HTTP routing
*/

// Get all item master records
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const obj = new ItemMaster(req, res)
    const results = await obj.getAll()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Get item master records that match search text and ordered by given field
router.get("/find", authenticateToken, async (req, res, next) => {
  try {
    const obj = new ItemMaster(req, res)
    const results = await obj.findSome()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Get one item master record by id
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const obj = new ItemMaster(req, res)
    const results = await obj.getOneById()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Create an item master record
router.post(
  "/",
  authenticateToken,
  validate("createItemMaster"),
  async (req, res, next) => {
    try {
      const obj = new ItemMaster(req, res)
      const results = await obj.create()
      res.json(results)
    } catch (e) {
      next(e)
    }
  }
)

// Update an item master record
router.put(
  "/:id",
  authenticateToken,
  validate("updateItemMaster"),
  async (req, res, next) => {
    try {
      const obj = new ItemMaster(req, res)
      const results = await obj.update()
      res.json(results)
    } catch (e) {
      next(e)
      throw e
    }
  }
)

//Delete an item master record
router.delete("/:id", authenticateToken, async (req, res, next) => {
  try {
    const obj = new ItemMaster(req, res)
    const results = await obj.delete()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

module.exports = router
