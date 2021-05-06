require("dotenv").config()
const { body } = require("express-validator/check")
const utils = require("../utils")
const BaseController = require("./base.controller")
const bcrypt = require("bcrypt")

/**
 * Auth User CONTROLLER: Process request and handle validation
 * (Combining controller and model in this class)
 */
class AuthUser extends BaseController {
  constructor(req, res) {
    // Prepare data for parent object
    const searchFields = ["email"]
    // Call constructor of parent object, passing in data
    super(req, res, "AuthUser", "g3tools", "auth_user", searchFields)
    // Database fields to be inserted/updated
    this.primaryFields = ["email"]
    this.fields = [
      "password",
      "first_name",
      "last_name",
      "contact_phone",
      "default_role_id",
      "current_role_id",
    ]
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

  async updatePassword(id) {
    try {
      // Collect data from request body
      //const data = await this.parseReq('UPDATE')
      const hashedPassword = await bcrypt.hash(this.req.body.newPassword, 10)
      this.id = id
      return await super.update(["password"], [hashedPassword])
    } catch (e) {
      throw e
      //throw utils.errMsg(e);
    }
  }

  async parseReq(method) {
    const hashedPassword = await bcrypt.hash(this.req.body.password, 10)
    const primaryData = [this.req.body.email]
    const fieldData = [
      hashedPassword,
      this.req.body.firstName,
      this.req.body.lastName,
      this.req.body.contactPhone,
      this.req.body.defaultRoleId,
      this.req.body.currentRoleId,
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
    // // Username exists already?
    // const username = data.username;
    // valError = await utils.primaryExists('Username', username, 'g3tools', 'auth_user', 'username', method === 'UPDATE' ? data.id : null);
    // if (valError != '') return valError;

    // Email unique in table?
    const email = data.email
    valError = await utils.fieldExists(
      "Email",
      email,
      "g3tools",
      "email",
      "email",
      "email",
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
      body("email", `Email is required`)
        .exists()
        .not()
        .isEmpty()
        .trim()
        .unescape(),
    ]
  }
  results.concat([
    body("password", `Password is required`)
      .exists()
      .not()
      .isEmpty()
      .trim()
      .unescape(),
  ])
  results.concat([
    body("firstName", `First name is required`)
      .exists()
      .not()
      .isEmpty()
      .trim()
      .unescape(),
  ])
  results.concat([
    body("lastName", `Last name is required`)
      .exists()
      .not()
      .isEmpty()
      .trim()
      .unescape(),
  ])
  return results
}

module.exports = { AuthUser, validate }
