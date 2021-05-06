const express = require("express")
const router = express.Router()
const {
  AuthRoleResource,
  validate,
} = require("../1-controllers/auth-role-resource")
const { authenticateToken } = require("../utils/auth-utils")

/* **********************************************
//  /brands ROUTES: Handle HTTP routing
*/

// Get all records
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const obj = new AuthRoleResource(req, res)
    const results = await obj.getAll()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Get records that match search text and ordered by given field
router.get("/find", authenticateToken, async (req, res, next) => {
  try {
    const obj = new AuthRoleResource(req, res)
    const results = await obj.findSome()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Get one record by id
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const obj = new AuthRoleResource(req, res)
    const results = await obj.getOneById()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Create a record
router.post(
  "/",
  authenticateToken,
  validate("CREATE"),
  async (req, res, next) => {
    try {
      const obj = new AuthRoleResource(req, res)
      const results = await obj.create()
      res.json(results)
    } catch (e) {
      next(e)
    }
  }
)

// Update a record
router.put(
  "/:id",
  authenticateToken,
  validate("UPDATE"),
  async (req, res, next) => {
    try {
      const obj = new AuthRoleResource(req, res)
      const results = await obj.update()
      res.json(results)
    } catch (e) {
      next(e)
      throw e
    }
  }
)

//Delete a record
router.delete("/:id", authenticateToken, async (req, res, next) => {
  try {
    const obj = new AuthRoleResource(req, res)
    const results = await obj.delete()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

module.exports = router
