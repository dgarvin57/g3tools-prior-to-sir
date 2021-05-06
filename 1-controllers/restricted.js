require("dotenv").config()
const { body } = require("express-validator/check")
const utils = require("../utils")
const BaseController = require("./base.controller")
const bcrypt = require("bcrypt")

/**
 * Restricted CONTROLLER: Process request and handle validation
 * (Combining controller and model in this class)
 */
class Restricted extends BaseController {
  constructor(req, res) {
    // Prepare data for parent object
    const searchFields = [
      "brand_name",
      "item_number",
      "product_description",
      "restricted_reason",
    ]
    // Convert camel case to underscore to match database
    // const useOrderBy = (fieldName) => {
    //   if (fieldName === 'brandName') return 'brand_name'
    //   if (fieldName === 'itemNumber') return 'item_number'
    //   if (fieldName === 'productDescription') return 'product_description'
    //   if (fieldName === 'restrictedReason') return 'restricted_reason'
    //   if (fieldName === 'insertDate') return 'insert_date'
    //   return fieldName
    // }
    // Convert camel case field name to database field name.
    // Field is passed in from front end as camel case
    const convertDbFields = value => {
      if (value === undefined || value === "") return ""
      let newValue = value
      newValue = newValue.replace("brandName", "brand_name")
      newValue = newValue.replace("itemNumber", "item_number")
      newValue = newValue.replace("productDescription", "product_description")
      newValue = newValue.replace("restrictedReason", "restricted_reason")
      newValue = newValue.replace("insertDate", "insert_date")
      return newValue
    }

    // Call constructor of parent object, passing in this component name, database, and table
    super(
      req,
      res,
      "AuthRestricted",
      "lookabout",
      "fgm_product_restricted_amazon",
      searchFields,
      convertDbFields(req.query.filter),
      convertDbFields(req.query.orderBy)
    )
    //console.log('this.orderBy', this.orderBy)
    //    this.orderBy = this.convertDbField(req.query.orderBy)
    // this.orderBy = 'item_number'
    // console.log('this.orderBy after', this.orderBy)

    // Database fields to be inserted/updated
    this.primaryFields = ["brand_name", "item_number"]
    this.fields = [
      "brand_name",
      "item_number",
      "product_description",
      "restricted_reason",
      "notes",
      "enabled",
      "insert_date",
    ]
    this.req = req
    this.res = res
  }

  // /**
  //  * Convert camel case field name to database field name.
  //  * Field is passed in from front end as camel case
  //  * @param {String} fieldName
  //  */
  // convertDbFields(value) {
  //   let newValue = value
  //   newValue = newValue.replace('brandName', 'brand_name')
  //   newValue = newValue.replace('itemNumber', 'item_number')
  //   newValue = newValue.replace('productDescription', 'product_description')
  //   newValue = newValue.replace('restrictedReason', 'restricted_reason')
  //   newValue = newValue.replace('insertDate', 'insert_date')
  //   return newValue
  // }

  /**
   * Entity-specific get: All enabled restricted (1 for enabled and 0 for disabled)
   */
  async getEnabled(enabled) {
    const getSql = {
      select: "SELECT *",
      from: "FROM lookabout.fgm_product_restricted_amazon a",
      join: "",
      where: `WHERE a.enabled = ${enabled} `,
      order: "ORDER BY a.brand_name, a.item_number",
    }
    // 'SELECT * FROM lookabout.fgm_product_restricted_amazon fpra ' +
    // `WHERE fpra.enabled = ${enabled} ` +
    // 'ORDER BY fpra.brand_name, fpra.item_number;'
    const roleResults = await super.getQuery(getSql)
    return roleResults
  }

  /**
   * Get unique brands in restricted records
   */
  async getBrands() {
    const getSql = {
      select: "SELECT a.brand_name",
      from: "FROM lookabout.fgm_product_restricted_amazon a",
      join: "",
      where: "",
      order: "a.brand_name",
      groupBy: "a.brand_name",
    }
    // 'SELECT * FROM lookabout.fgm_product_restricted_amazon fpra ' +
    // `WHERE fpra.enabled = ${enabled} ` +
    // 'ORDER BY fpra.brand_name, fpra.item_number;'
    const roleResults = await super.getQuery(getSql)
    return roleResults
  }

  /**
   * Get unique restricted_reason in restricted records
   */
  async getReasons() {
    const getSql = {
      select: "SELECT a.restricted_reason",
      from: "FROM lookabout.fgm_product_restricted_amazon a",
      join: "",
      where: "",
      order: "",
      groupBy: "a.restricted_reason",
    }
    // 'SELECT * FROM lookabout.fgm_product_restricted_amazon fpra ' +
    // `WHERE fpra.enabled = ${enabled} ` +
    // 'ORDER BY fpra.brand_name, fpra.item_number;'
    const roleResults = await super.getQuery(getSql)
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
      //      const createFields = this.primaryFields.concat(this.fields)
      const createFields = this.fields
      return await super.create(createFields, data)
    } catch (e) {
      //throw e
      throw utils.errMsg(e)
    }
  }

  async update() {
    try {
      // Record (cross-field) validation
      const valRec = await this.tableValidation(this.req.body, "UPDATE")
      if (valRec !== "") {
        this.res.status(422).json({ errors: valRec })
        return
      }

      // Collect data from request body
      const data = await this.parseReq("UPDATE")
      return await super.update(this.fields, data)
    } catch (e) {
      throw e
    }
  }

  async parseReq(method) {
    const primaryData = [this.req.body.brandName, this.req.body.itemNumber]
    const fieldData = [
      this.req.body.productDescription,
      this.req.body.restrictedReason,
      this.req.body.notes,
      this.req.body.enabled,
      this.req.body.insertDate,
    ]
    //    return method === 'CREATE' ? primaryData.concat(fieldData) : fieldData
    return primaryData.concat(fieldData)
  }

  /**
   * Given data for record, validate across fields, for example,
   * the following field must be unique: username.
   * @param {JSON} data Fields and data for this record
   * @param {string} method Create or Update method?
   * @returns {string} Empty if validated and error message if not
   */
  async tableValidation(data, method) {
    // let valError
    // // resource name unique in table?
    // const email = data.email
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
      body("brandName", `Brand name is required`)
        .exists()
        .not()
        .isEmpty()
        .trim()
        .unescape(),
      body("itemNumber", `Item number is required`)
        .exists()
        .not()
        .isEmpty()
        .trim()
        .unescape(),
      body("productDescription", `Product description is required`)
        .exists()
        .not()
        .isEmpty()
        .trim()
        .unescape(),
      body("restrictedReason", `Restricted reason is required`)
        .exists()
        .not()
        .isEmpty()
        .trim()
        .unescape(),
    ]
  }
  return results
}

module.exports = { Restricted: Restricted, validate }
