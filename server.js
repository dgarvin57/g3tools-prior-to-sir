const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const app = express()
const expressValidator = require("express-validator")
const authUtils = require("./utils/auth-utils")
require("run-middleware")(app)
const config = require("./config")

// *********************************************
// Change log
// 11/10/20: v0.10 - Added cors to server.js
// 12/3/20:  v0.11 - Auth refinements
//  3/4/21:  v0.12 - To date changes
// *********************************************

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator())
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:8080",
  })
)
// app.use(cors)

// Routes
require("./0-routes")(app)

// Start server
app.listen(config.port || 3000, () =>
  console.log(`g3tools-api listening on port ${config.port || 3000}!`)
)

// Prune expired tokens (every 6 hours)
setInterval(authUtils.pruneExpiredTokens, 1000 * 60 * 60 * 6)

module.exports = {
  app,
}

// TODO: Improve error handler: One place other than utils/index.js; structure return to caller;
// TODO: Maybe better logging.
// TODO: Logout (delete the saved access token on the client)
