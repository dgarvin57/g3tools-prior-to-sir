const express = require("express")
const { AuthUser, validate } = require("../1-controllers/auth-user")
const { authenticateToken } = require("../utils/auth-utils")
const authUtils = require("../utils/auth-utils")
const router = express.Router()

/* **********************************************
//  /user ROUTES: Handle HTTP routing
*/

//Test route
router.get("/test", async (req, res, next) => {
  try {
    const obj = new AuthUser(req, res)
    const results = await obj.getAll()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

//Test route authenticated
router.get("/testAuth", authenticateToken, async (req, res, next) => {
  try {
    const obj = new AuthUser(req, res)
    const results = await obj.getAll()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Get all user records
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const obj = new AuthUser(req, res)
    const results = await obj.getAll()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Get user records that match search text and ordered by given field
router.get("/find", authenticateToken, async (req, res, next) => {
  try {
    const obj = new AuthUser(req, res)
    const results = await obj.findSome()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Get one user record by id
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const obj = new AuthUser(req, res)
    const results = await obj.getOneById()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// Create a user record
router.post(
  "/",
  authenticateToken,
  validate("CREATE"),
  async (req, res, next) => {
    try {
      const obj = new AuthUser(req, res)
      const results = await obj.create()
      res.json(results)
    } catch (e) {
      next(e)
    }
  }
)

// Update a user record
router.put(
  "/:id",
  authenticateToken,
  validate("UPDATE"),
  async (req, res, next) => {
    try {
      const obj = new AuthUser(req, res)
      const results = await obj.update()
      res.json(results)
    } catch (e) {
      next(e)
      throw e
    }
  }
)

//Delete an user record
router.delete("/:id", authenticateToken, async (req, res, next) => {
  try {
    const obj = new AuthUser(req, res)
    const results = await obj.delete()
    res.json(results)
  } catch (e) {
    next(e)
  }
})

// User login
router.post("/login", async (req, res) => {
  try {
    const results = await authUtils.login(req, res)
    res.status(results.status)
    // res.cookie('jwt', results.refreshToken, {
    //   secure: false,
    //   httpOnly: true,
    // })
    res.send(results.results)
  } catch (e) {
    //    res.status(500).send(`Error: ${e.message}. Sql: ${e.sql}`);
    res.status(500).send(e)
  }
})
//TODO: Pass refresh token back to client via an httpOnly cookie to guard against CRSF attacks. Need to work through this.

// Encrypt a password
router.post("/encrypt-password", async (req, res) => {
  try {
    const results = await authUtils.encryptPassword(req, res)
    res.json(results)
  } catch (e) {
    res.status(500).send(e)
  }
})

// Change password
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const results = await authUtils.changePassword(req, res)
    res.status(results.status).send(results.message)
  } catch (e) {
    res.status(500).send(e)
  }
})

// User logout
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const results = await authUtils.logout(req, res)
    res.status(results.status).send(results.results)
  } catch (e) {
    res.status(500).send(e)
  }
})

module.exports = router
