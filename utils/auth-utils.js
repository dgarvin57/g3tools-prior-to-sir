const { AuthUser } = require("../1-controllers/auth-user")
const { AuthRole } = require("../1-controllers/auth-role")
const { AuthToken } = require("../1-controllers/auth-token")
const BaseController = require("../1-controllers/base.controller")

const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const config = require("../config")

exports.login = async function (req, res) {
  // Check user id
  const authUser = new AuthUser(req, res)
  const userResults = await authUser.getOneByName("email", req.body.email)
  if (
    userResults === undefined ||
    (typeof userResults.results === "string" &&
      userResults.results.includes("No matches"))
  ) {
    return { status: 401, results: `Unknown user id: ${req.body.email}` }
  }
  // User name is authenticated. userResults.results is the user record from db
  const user = userResults.results
  if (await bcrypt.compare(req.body.password, user.password)) {
    // Password is authenticated
    const accessToken = generateAccessToken({ username: user.email })
    // ***** Authenticated *****
    // Create refresh token
    const refreshToken = generateRefreshToken({ username: user.email })
    // And save it in database
    const refreshAuthUser = new AuthToken(req, res)
    await refreshAuthUser.create(refreshToken)

    // Get all roles assigned to this user
    const authRole = new AuthRole(req, res)
    // Get roles assigned to this user
    const rolesForThisUser = await authRole.getRolesByUserId(user.id)
    // Get permissions assigned to the user's current role
    const permissionsForThisRole = await authRole.getPermissionsByRoleId(
      user.id,
      user.currentRoleId
    )
    // Calculate expiry for access token
    // const expiry = new Date()
    // expiry.setMinutes(expiry.getMinutes() + config.accessTokenExpiresInMinutes)

    // Return access and refresh tokens to client
    const auth = {
      tokens: {
        accessToken: accessToken,
        accessTokenExpiryMinutes: config.accessTokenExpiresInMinutes,
        refreshToken: refreshToken,
      },
      userId: user.id,
      username: user.email,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      defaultRoleId: user.defaultRoleId,
      currentRoleId: user.currentRoleId,
      roles: [1, 2],
      permissions: [1, 2],
    }
    // Apply roles
    auth.roles =
      rolesForThisUser.results.length > 0 ? rolesForThisUser.results : []
    // Apply permissions
    auth.permissions =
      permissionsForThisRole.results.length > 0
        ? permissionsForThisRole.results
        : []
    //    return { status: 200, results: auth, refreshToken: refreshToken }
    return { status: 200, results: auth }
  } else {
    return { status: 401, results: "Invalid password" }
  }
}

/**
 * Log out. Normally, the client logout function will just delete the access token.
 * This is provided to allow logging out the user from the server, for example,
 * - Reset/change password
 * - Admin force logout
 */
exports.logout = async function (req, res) {
  // Blacklist token
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]
  // Instantiate BaseController for the token blacklist object
  const objBase = new BaseController(
    req,
    res,
    "BlacklistToken",
    "g3tools",
    "auth_tokens_blacklist",
    ""
  )
  // Add to blacklist table
  await objBase.create(["token"], [token])
  return { status: 200, results: "Logged out" }
}

exports.changePassword = async function (req, res) {
  try {
    const currentPass = req.body.currentPassword
    const newPass = req.body.newPassword
    if (!currentPass) return res.status(400).send("Current password missing")
    if (!newPass) return res.status(400).send("New password missing")
    if (!req.body.email) return res.status(400).send("Email missing")
    // Verify current password in req.body
    // Check user id
    const authUser = new AuthUser(req, res)
    const user = await authUser.getOneByName("email", req.body.email)
    if (user.status === -1) return res.status(401).send(user.results)
    if (await bcrypt.compare(currentPass, user.results.password)) {
      //Save new password in user record
      const authUser = new AuthUser(req, res)
      const userResult = await authUser.updatePassword(user.results.id)
      return { status: 200, message: "Password successfully changed" }
    } else {
      return { status: 401, message: "Invalid current password" }
    }
  } catch (err) {
    return { status: 401, message: `Error changing password: ${err}` }
  }
}

/**
 * Refresh token. Get refresh token from request body and see if it is in
 * the database. If so, generate a new access token and refresh token
 * and return to client.
 * Failure to validate refresh token will result in 401 HTTP status code.
 */
exports.refreshToken = async function (req, res) {
  const authHeader = req.headers["authorization"]
  const refreshToken = authHeader && authHeader.split(" ")[1]
  if (refreshToken == null)
    return { status: 401, tokens: `Refresh token not found` }
  // Token exists: Check in database for a match
  const authToken = new AuthToken(req, res)
  const userResults = await authToken.getOneByName(
    "refresh_token",
    refreshToken
  )
  if (
    userResults === undefined ||
    (typeof userResults.results === "string" &&
      userResults.results.includes("No matches"))
  ) {
    // Don't recognize this refresh token
    return { status: 401, tokens: `Unknown refresh token` }
  }
  // Refresh token is found
  const results = await jwt.verify(
    refreshToken,
    config.refreshTokenSecret,
    async (err, user) => {
      if (err) {
        return {
          status: 401,
          tokens: `Error generating refresh token: ${err.message}`,
        }
      } else {
        // ***********************************
        // Refresh token is verified: Create new access token
        const accessToken = generateAccessToken({ username: user.email })
        // Create refresh token
        const refreshToken = generateRefreshToken({ username: user.email })
        // const expiry = new Date()
        // expiry.setMinutes(expiry.getMinutes() + config.accessTokenExpiresInMinutes)
        const tokens = {
          accessToken: accessToken,
          accessTokenExpiryMinutes: config.accessTokenExpiresInMinutes,
          refreshToken: refreshToken,
        }
        //results = { status: 200, tokens }
        // And save new refresh token it in database
        const refreshAuthUser = new AuthToken(req, res)
        await refreshAuthUser.create(refreshToken)
        return { status: 200, tokens }
      }
    }
  )
  return results
  //console.log(results)
}

function generateAccessToken(user) {
  // Create json web token to return to user to be used for future authentication
  return jwt.sign(user, config.accessTokenSecret, {
    expiresIn: `${config.accessTokenExpiresInMinutes}m`,
  })
}

function generateRefreshToken(user) {
  // Create json web token to return to user to be used for future authentication
  return jwt.sign(user, config.refreshTokenSecret, {
    expiresIn: `${config.refreshTokenExpiresInHours}h`,
  })
}

exports.pruneExpiredTokens = async function () {
  //await app.runMiddleware('/tokens/pruneZzi39', function (code, body, headers) {
  //  console.log(`${new Date()} - ${body}`);
  //})
  // Create request and response object to simulate an actual request/response
  const req = { query: {}, params: {} }
  const res = {}
  const authToken = new AuthToken(req, res)
  const result = await authToken.pruneExpiredTokens()
  console.log(`${new Date()} - ${result}`)
}

/**
 * Authenticate access token passed in from client. Any failure to
 * validate token should result in 401 HTTP code, "Not authorized".
 */
exports.authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]
    if (!token) return res.status(401).send("Access token missing")
    // Valid token: Check against blacklist in case user logged out
    // Instantiate BaseController for the token blacklist object
    const objBase = new BaseController(
      req,
      res,
      "BlacklistToken",
      "g3tools",
      "auth_tokens_blacklist",
      ""
    )
    const results = await objBase.getOneByName("token", token)
    if (results.status !== -1) {
      // Token is blacklisted, meaning user has logged out, invalidate
      return res.status(401).send("Access token logged out")
    }
    // Not logged out: Verify
    jwt.verify(token, config.accessTokenSecret, (err, user) => {
      if (err) return res.status(401).send("Access token expired")
      // *****************************
      // Verified token
      req.user = user
      next()
    })
  } catch (err) {
    return res.status(401).send(`Unknown access token error: ${err}`)
  }
}

exports.encryptPassword = async (req, res) => {
  return bcrypt.hash(req.body.password, 10)
}

exports.addCustomHeaders = function (res, results) {
  res.header("Access-Control-Expose-Headers", "X-Total-Count,X-Max-Pages")
  res.header("X-Total-Count", results.totalRows || 0)
  res.header("X-Max-Pages", results.maxPages || 0)
  return res
}
