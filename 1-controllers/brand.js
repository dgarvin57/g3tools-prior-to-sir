require("dotenv").config()
const { body } = require("express-validator/check")
const utils = require("../utils")
const BaseController = require("./base.controller")

/**
 * Brand CONTROLLER: Process request and handle validation
 * (Combining controller and model in this class)
 */
class Brand extends BaseController {
  constructor(req, res) {
    // Prepare data for parent object
    const searchFields = [
      "brandName",
      "abbreviation",
      "description",
      "vendorName",
    ]
    // Call constructor of parent object, passing in data
    super(req, res, "Brand", "lookabout", "fgm_product_brand", searchFields)
    // Database fields to be inserted/updated
    this.primaryFields = ["brandName"]
    this.fields = [
      "brandName",
      "abbreviation",
      "description",
      "active",
      "vendorName",
      "note",
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
        return valRec
      }

      // Collect data from request body
      const data = await this.parseReq("CREATE")
      //      const createFields = this.primaryFields.concat(this.fields)
      // 1/20/21: Primary field is included in fields
      const createFields = this.fields
      return await super.create(createFields, data)
    } catch (e) {
      //throw e;
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
      //throw e;
      throw utils.errMsg(e)
    }
  }

  parseReq(method) {
    const primaryData = [this.req.body.brandName]
    const fieldData = [
      this.req.body.abbreviation,
      this.req.body.description,
      this.req.body.active,
      this.req.body.vendorName,
      this.req.body.note,
    ]
    //    return method === 'CREATE' ? primaryData.concat(fieldData) : fieldData
    // 1/20/21: Include primary fields with field data so we can update them
    return primaryData.concat(fieldData)
  }

  /**
   * Given data for record, validate across fields, for example,
   * the following fields need to be unique besides the primary key (item_number):
   * UPC, SKU, and mfg_item_number, etc.
   * @param {JSON} data Fields and data for this record
   * @param {string} method Create or Update method?
   * @returns {string} Empty if validated and error message if not
   */
  async tableValidation(data, method) {
    let valError
    // // brand name exists already?
    // const brandName = data.brandName;
    // valError = await utils.primaryExists('Brand Name', brandName, 'lookabout', 'fgm_product_brand', 'brandName', method === 'UPDATE' ? this.id : null);
    // if (valError != '') return valError;

    // brand name unique in table?
    const brandName = data.brandName

    valError = await utils.fieldExists(
      "Brand Name",
      brandName,
      "lookabout",
      "fgm_product_brand",
      "brandName",
      "brandName",
      method === "UPDATE" ? this.id : null
    )

    if (valError != "") return valError

    // abbreviation unique in table?
    const mfg = data.abbreviation
    valError = await utils.fieldExists(
      "Abbreviation",
      mfg,
      "lookabout",
      "fgm_product_brand",
      "abbreviation",
      "brandName",
      method === "UPDATE" ? this.id : null
    )
    if (valError != "") return valError

    return ""
  }
}

/**
 * Field validation
 */
function validate(method) {
  let results = []
  if (method === "CREATE") {
    // Only check for brand name if creating a new record
    results = [
      body("brandName", `Brand name is required`)
        .exists()
        .not()
        .isEmpty()
        .trim()
        .unescape(),
    ]
  }
  results.concat([
    body("abbreviation", `Abbreviation is required`)
      .exists()
      .not()
      .isEmpty()
      .trim()
      .unescape(),
    body("description").trim().unescape(),
    body("active", `Active is required and must be true or false`)
      .exists()
      .not()
      .isEmpty()
      .isBoolean()
      .trim()
      .unescape(),
    body("vendorName", `vendorName is required`)
      .exists()
      .not()
      .isEmpty()
      .trim()
      .unescape(),
    body("note").trim().unescape(),
  ])
  return results
}

module.exports = { Brand, validate }
