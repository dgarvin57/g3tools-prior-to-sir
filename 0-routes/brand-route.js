const express = require("express")
const { utils } = require("mocha")
const router = express.Router()
const { Brand, validate } = require("../1-controllers/brand")
const { authenticateToken, addCustomHeaders } = require("../utils/auth-utils")

/* **********************************************
//  /brands ROUTES: Handle HTTP routing
*/

// Get all records
router.get("/", async (req, res, next) => {
  try {
    const obj = new Brand(req, res)
    const results = await obj.getAll()
    const useRes = addCustomHeaders(res, results)
    useRes.json(results.results)
  } catch (e) {
    next(e)
  }
})

// addCustomHeaders = function (res, results) {
//   res.header('Access-Control-Expose-Headers', 'X-Total-Count,X-Max-Pages')
//   res.header('X-Total-Count', results.totalRows || 0)
//   res.header('X-Max-Pages', results.maxPages || 0)
//   return res
// }

// Get records that match search text and ordered by given field
router.get("/find", async (req, res, next) => {
  try {
    const obj = new Brand(req, res)
    const results = await obj.findSome()

    const useRes = addCustomHeaders(res, results)
    // res.header('Access-Control-Expose-Headers', 'X-Total-Count,X-Max-Pages')
    // res.header('X-Total-Count', results.totalRows || 0)
    // res.header('X-Max-Pages', results.maxPages || 0)

    useRes.json(results.results)
  } catch (e) {
    next(e)
  }
})

// Get one record by id
router.get("/:id", async (req, res, next) => {
  try {
    const obj = new Brand(req, res)
    const results = await obj.getOneById()
    const useRes = addCustomHeaders(res, results)
    useRes.json(results.results)
  } catch (e) {
    next(e)
  }
})

// Create a record
router.post("/", validate("CREATE"), async (req, res, next) => {
  try {
    const obj = new Brand(req, res)
    const results = await obj.create()
    res.json(results.results)
  } catch (e) {
    next(e)
  }
})

// Update a record
router.put("/:id", validate("UPDATE"), async (req, res, next) => {
  try {
    const obj = new Brand(req, res)
    const results = await obj.update()
    res.json(results)
  } catch (e) {
    next(e)
    throw e
  }
})

//Delete a record
router.delete("/:id", async (req, res, next) => {
  try {
    const obj = new Brand(req, res)
    const results = await obj.delete()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

module.exports = router
