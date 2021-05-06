const BaseController = require("./base.controller")
const jwtDecode = require("jwt-decode")
const utils = require("../utils")

/**
 * Refresh Tokens CONTROLLER: Process request and handle validation
 * (Combining controller and model in this class)
 */
class AuthToken extends BaseController {
  constructor(req, res) {
    const searchText = ["refresh_token"]
    super(req, res, "AuthToken", "g3tools", "auth_refresh_tokens", searchText)
    // Database fields to be inserted/updated
    this.fields = ["refresh_token"]
    this.req = req
    this.res = res
  }

  /**
   * Override base create method to pass in array of fields and data
   * to be inserted into the table
   */
  async create(refreshToken) {
    if (refreshToken == null || refreshToken === "") {
      throw new Error(
        "User name and refresh token are required to create a refresh tokens record"
      )
    }
    // Package data
    const data = [refreshToken]
    return await super.create(this.fields, data)
  }

  /**
   * List all refresh tokens being saved in the database
   * and decode, showing id, user, token, iat, and exp.
   */
  async listRefreshTokens() {
    const dbResult = await this.getAll()
    if (typeof dbResult === "string" && dbResult.includes("No matches")) {
      // Record with id not found
      return { results: dbResult }
    }
    // Refresh tokens found
    const arrTokens = Array.isArray(dbResult.results)
      ? dbResult.results
      : [dbResult.results]
    const tokensList = []
    arrTokens.map(token => {
      const decoded = jwtDecode(token.refreshToken)
      const record = {
        id: token.id,
        token: token.refreshToken,
        username: decoded.username,
        iat: decoded.iat,
        iatDate: new Date(parseInt(decoded.iat) * 1000),
        exp: decoded.exp,
        expDate: new Date(parseInt(decoded.exp) * 1000),
        expired:
          decoded.exp < Date.now() / 1000 || decoded.exp === undefined
            ? true
            : false,
      }
      tokensList.push(record)
    })

    const results = utils.convertDbCols(tokensList)
    const done = this.paginationNextPrev(dbResult.totalRows, tokensList, this)
    return done
  }

  /**
   * Go through list of refresh tokens in database and
   * remove those that are expired
   */
  async pruneExpiredTokens() {
    try {
      const dbResult = await this.listRefreshTokens()
      if (typeof dbResult === "string" && dbResult.includes("No matches")) {
        // Record with id not found
        return { results: dbResult }
      }
      const arrTokens = Array.isArray(dbResult.results)
        ? dbResult.results
        : [dbResult.results]
      let count = 0
      await Promise.all(
        arrTokens.map(async token => {
          const id = token.id
          if (token.expired) {
            const result = await this.delete(id)
            if (result.toString().includes("Success")) count++
          }
        })
      )
      if (count === 0) return "No expired refresh tokens to delete"
      return `Deleted ${count} refresh tokens`
    } catch (e) {
      throw e
    }
  }

  // /**
  //  * Add token to blacklist table to logout, etc.
  //  */
  // async blacklistToken(token) {
  //   // Instantiate another BaseController for the token blacklist object
  //   const objBase = new BaseController(req, res, 'BlacklistToken', 'g3tools', 'auth_tokens_blacklist', '');
  //   return objBase.create(['token', token])
  // }
}
module.exports = { AuthToken }
