require("dotenv").config()
const { body } = require("express-validator/check")
const utils = require("../utils")
const BaseController = require("./base.controller")
const bcrypt = require("bcrypt")

/**
 * Auth Role CONTROLLER: Process request and handle validation
 * (Combining controller and model in this class)
 */
class AuthRole extends BaseController {
  constructor(req, res) {
    // Prepare data for parent object
    const searchFields = ["role_name"]
    // Call constructor of parent object, passing in this component name, database, and table
    super(req, res, "AuthRole", "g3tools", "auth_role", searchFields)
    // Database fields to be inserted/updated
    this.primaryFields = ["role_name"]
    this.fields = ["description"]
    this.req = req
    this.res = res
  }

  /**
   * Role-specific get: All roles assigned to the given user id
   */
  async getRolesByUserId(userId) {
    const getSql = {
      select: "SELECT ar.id, ar.role_name ",
      from: "FROM g3tools.auth_user_role a",
      join:
        "JOIN g3tools.auth_user au ON a.user_id = au.id " +
        "JOIN g3tools.auth_role ar ON a.role_id = ar.id ",
      where: `WHERE a.user_id = ${userId} `,
      order: "ORDER BY ar.role_name;",
    }
    // 'SELECT ar.id, ar.role_name ' +
    // 'FROM g3tools.auth_user_role aur ' +
    // 'JOIN g3tools.auth_user au ON aur.user_id = au.id ' +
    // 'JOIN g3tools.auth_role ar ON aur.role_id = ar.id ' +
    // `WHERE aur.user_id = ${userId} ` +
    // 'ORDER BY ar.role_name;'
    const roleResults = await super.getQuery(getSql)
    return roleResults
  }

  /**
   * Role-specific get: All permissions for roles assigned to the given user id
   */
  async getPermissionsByRoleId(userId, roleId) {
    const sql = {
      select:
        "SELECT ar1.resource_name, a.`create`, a.`read`, a.`update`, a.`delete` ",
      from: "FROM g3tools.auth_role_resource_permission a ",
      join:
        "JOIN g3tools.auth_resource ar1 ON a.resource_id = ar1.id " +
        "JOIN g3tools.auth_role ar ON a.role_id = ar.id " +
        "JOIN g3tools.auth_user_role aur ON ar.id = aur.role_id ",
      where: `WHERE a.role_id = ${roleId} AND aur.user_id = ${userId} `,
      order: "ORDER BY ar.role_name;",
    }

    const roleResults = await super.getQuery(sql)
    return roleResults
  }

  /**
   * Override base create method to pass in array of fields and data
   * to be inserted into the table
   */
  async create() {
    try {
      // Record (cross-field) validation
      const valRec = await this.tableValidation(this.req.body, "CREATE")
      if (valRec !== "") {
        this.res.status(422).json({ errors: valRec })
        return
      }

      // Collect data from request body
      const data = await this.parseReq("CREATE")
      const createFields = this.primaryFields.concat(this.fields)
      return await super.create(createFields, data)
    } catch (e) {
      throw e
      //throw utils.errMsg(e);
    }
  }

  async update() {
    try {
      // // Record (cross-field) validation
      // const valRec = await this.tableValidation(this.req.body, 'UPDATE');
      // if (valRec !== '') {
      //   this.res.status(422).json({ errors: valRec });
      //   return;
      // }

      // Collect data from request body
      const data = await this.parseReq("UPDATE")
      return await super.update(this.fields, data)
    } catch (e) {
      throw e
      //throw utils.errMsg(e);
    }
  }

  async parseReq(method) {
    const primaryData = [this.req.body.roleName]
    const fieldData = [this.req.body.description]
    return method === "CREATE" ? primaryData.concat(fieldData) : fieldData
  }

  /**
   * Given data for record, validate across fields, for example,
   * the following field must be unique: username.
   * @param {JSON} data Fields and data for this record
   * @param {string} method Create or Update method?
   * @returns {string} Empty if validated and error message if not
   */
  async tableValidation(data, method) {
    let valError
    // // Username exists already?
    // const username = data.username;
    // valError = await utils.primaryExists('Username', username, 'g3tools', 'auth_user', 'username', method === 'UPDATE' ? data.id : null);
    // if (valError != '') return valError;

    // Email unique in table?
    const email = data.email
    valError = await utils.fieldExists(
      "Role Name",
      roleName,
      "g3tools",
      "auth_role",
      "role_name",
      "role_name",
      method === "UPDATE" ? this.id : null
    )
    if (valError != "") return valError
    return ""
  }
}

/**
 * Field validation (called from router). validationResults contains results of this validation.
 * This is outside the controller class on purpose so it can be used in router as middleware call.
 */
function validate(method) {
  let results = []
  if (method === "CREATE") {
    results = [
      body("roleName", `Role name is required`)
        .exists()
        .not()
        .isEmpty()
        .trim()
        .unescape(),
    ]
  }
  return results
}

module.exports = { AuthRole, validate }
