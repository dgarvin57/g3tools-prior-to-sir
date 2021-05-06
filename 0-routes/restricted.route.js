const express = require("express")
const router = express.Router()
const { Restricted, validate } = require("../1-controllers/restricted")
const { authenticateToken, addCustomHeaders } = require("../utils/auth-utils")

/* **********************************************
//  /Restricted ROUTES: Handle HTTP routing
*/

// Get all records
router.get("/", async (req, res, next) => {
  try {
    const obj = new Restricted(req, res)
    const results = await obj.getAll()
    const useRes = addCustomHeaders(res, results)
    useRes.json(results.results)
  } catch (e) {
    next(e)
  }
})

// // Get all records
// router.get('/', authenticateToken, async (req, res, next) => {
//   try {
//     const obj = new AuthRestricted(req, res)
//     const results = await obj.getAll()
//     res.json(results)
//   } catch (e) {
//     next(e)
//   }
// })

// Get all records that are enabled/disabled
router.get("/enabled", async (req, res, next) => {
  try {
    const obj = new Restricted(req, res)
    const results = await obj.getEnabled(1)
    const useRes = addCustomHeaders(res, results)
    useRes.json(results.results)
  } catch (e) {
    next(e)
  }
})

// Get all records that are enabled/disabled
router.get("/disabled", async (req, res, next) => {
  try {
    const obj = new Restricted(req, res)
    const results = await obj.getEnabled(0)
    const useRes = addCustomHeaders(res, results)
    useRes.json(results.results)
  } catch (e) {
    next(e)
  }
})

// Get records that match search text and ordered by given field
router.get("/find", async (req, res, next) => {
  try {
    const obj = new Restricted(req, res)
    const results = await obj.findSome()
    const useRes = addCustomHeaders(res, results)
    useRes.json(results.results)
  } catch (e) {
    next(e)
  }
})

// Get list of unique brands within restricted records
router.get("/brands", async (req, res, next) => {
  try {
    const obj = new Restricted(req, res)
    const results = await obj.getBrands()
    const useRes = addCustomHeaders(res, results)
    useRes.json(results.results)
  } catch (e) {
    next(e)
  }
})

// Get list of unique restricted_reason within restricted records
router.get("/reasons", async (req, res, next) => {
  try {
    const obj = new Restricted(req, res)
    const results = await obj.getReasons()
    const useRes = addCustomHeaders(res, results)
    useRes.json(results.results)
  } catch (e) {
    next(e)
  }
})

// Get one record by id
router.get("/:id", async (req, res, next) => {
  try {
    const obj = new Restricted(req, res)
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
    const obj = new Restricted(req, res)
    const results = await obj.create()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Update a record
router.put("/:id", validate("UPDATE"), async (req, res, next) => {
  try {
    const obj = new Restricted(req, res)
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
    const obj = new Restricted(req, res)
    const results = await obj.delete()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

module.exports = router
