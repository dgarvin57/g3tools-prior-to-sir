require("dotenv").config()
const { body } = require("express-validator/check")
const utils = require("../utils")
const BaseController = require("./base.controller")
const bcrypt = require("bcrypt")

/**
 * Auth Role CONTROLLER: Process request and handle validation
 * (Combining controller and model in this class)
 */
class AuthRoleResource extends BaseController {
  constructor(req, res) {
    // Prepare data for parent object
    const searchFields = ["resource_name"]
    // Call constructor of parent object, passing in this component name, database, and table
    super(
      req,
      res,
      "AuthRoleResource",
      "g3tools",
      "auth_role_resource_permission",
      searchFields
    )
    // Database fields to be inserted/updated
    this.primaryFields = ["role_id", "resource_id"]
    this.fields = ["create", "read", "update", "delete"]
    this.req = req
    this.res = res
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
      // Collect data from request body
      const data = await this.parseReq("UPDATE")
      return await super.update(this.fields, data)
    } catch (e) {
      throw e
    }
  }

  async parseReq(method) {
    const primaryData = [this.req.body.roleId, this.req.body.resourceId]
    const fieldData = [
      this.req.body.create,
      this.req.body.read,
      this.req.body.update,
      this.req.body.delete,
    ]
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
    // resource name unique in table?
    // valError = await utils.fieldExists(
    //   'Resource Name',
    //   resourceName,
    //   'g3tools',
    //   'auth_resource',
    //   'resource_name',
    //   'resource_name',
    //   method === 'UPDATE' ? this.id : null
    // )
    // if (valError != '') return valError
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
      body("roleId", `Role id is required`)
        .exists()
        .not()
        .isEmpty()
        .trim()
        .unescape()
        .isInt(),
      body("resourceId", `Resource id is required`)
        .exists()
        .not()
        .isEmpty()
        .trim()
        .unescape()
        .isInt(),
    ]
  }
  return results
}

module.exports = { AuthRoleResource, validate }
