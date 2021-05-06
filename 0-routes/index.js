const itemRouter = require("./item.route")
const authUserRouter = require("./auth-user.route")
const authTokenRouter = require("./auth-token.route")
const brandRouter = require("./brand-route")
const authRoleRouter = require("./auth-role.route")
const authResourceRouter = require("./auth-resource.route")
const authRoleResourceRouter = require("./auth-role-resource.route")
const authUserRoleRouter = require("./auth-user-role.route")
const restrictedRouter = require("./restricted.route")

// Use this to identify main routes so the specific route.js files
// don't have to specifiy the base route
module.exports = function (app) {
  app.use("/itemMaster", itemRouter)
  app.use("/user", authUserRouter)
  app.use("/token", authTokenRouter)
  app.use("/brand", brandRouter)
  app.use("/role", authRoleRouter)
  app.use("/resource", authResourceRouter)
  app.use("/roleResource", authRoleResourceRouter)
  app.use("/userRole", authUserRoleRouter)
  app.use("/restricted", restrictedRouter)
}
