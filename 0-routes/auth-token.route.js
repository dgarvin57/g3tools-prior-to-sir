const express = require("express")
const { AuthToken } = require("../1-controllers/auth-token")
const { authenticateToken } = require("../utils/auth-utils")
const authUtils = require("../utils/auth-utils")
const router = express.Router()

/* **********************************************
//  /tokens ROUTES: Handle HTTP routing
*/

// Get all records
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const authToken = new AuthToken(req, res)
    const results = await authToken.listRefreshTokens()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Get records that match search text and ordered by given field
router.get("/find", authenticateToken, async (req, res, next) => {
  try {
    const authToken = new AuthToken(req, res)
    const results = await authToken.findSome()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Get one record by id
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const authToken = new AuthToken(req, res)
    const results = await authToken.getOneById()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Create a record
router.post("/", authenticateToken, async (req, res, next) => {
  try {
    const authToken = new AuthToken(req, res)
    const results = await authToken.create()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Prune expired tokens
router.delete("/pruneZzi39", async (req, res) => {
  try {
    const authToken = new AuthToken(req, res)
    const results = await authToken.pruneExpiredTokens()
    res.json(results)
  } catch (e) {
    res.status(500).send(`Error: ${e}`)
  }
})

//Delete a record
router.delete("/:id", authenticateToken, async (req, res, next) => {
  try {
    const authToken = new AuthToken(req, res)
    const results = await authToken.delete()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Refresh token
router.post("/refresh", async (req, res) => {
  try {
    const results = await authUtils.refreshToken(req, res)
    res.status(results.status).send(results.tokens)
  } catch (e) {
    res.status(500).send(e)
  }
})

module.exports = router
