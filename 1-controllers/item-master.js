require("dotenv").config()
const { body } = require("express-validator/check")
const utils = require("../utils")
const BaseController = require("./base.controller")

/**
 * Item Master CONTROLLER: Process request and handle validation
 * (Combining controller and model in this class)
 */
class ItemMaster extends BaseController {
  constructor(req, res) {
    // Prepare data for parent object
    const searchFields = [
      "item_number",
      "amazon_sku",
      "product_title",
      "amazon_sku",
      "amazon_asin",
      "upc",
    ]
    // Call constructor of parent object, passing in data
    super(req, res, "ItemMaster", "g3tools", "item_master", searchFields)
    // Database fields to be inserted/updated
    this.primaryFields = ["item_number"]
    this.fields = [
      "mfg_item_number",
      "brand_name",
      "product_title",
      "product_type",
      "style_code",
      "color_code",
      "color",
      "size",
      "upc",
      "alternate_upc",
      "cost",
      "msrp",
      "note",
      "amazon_sku",
      "amazon_asin",
      "amazon_fnsku",
      "ebay_sku",
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

      // Construct fields and data for only those passed in to avoid undefined errors
      let useData
      let useFields
      let count = 0
      //      for (let i = 0; i < Object.keys(this.req.body).length; i++) {
      for (let field of Object.keys(this.req.body)) {
        if (
          Object.keys(field) !== "itemNumber" &&
          //          this.req.body[i] !== null) {
          field != null
        ) {
          // Save data
          //useData.push(this.req.body[i])
          useData.push(field)
          // Save column name
          useFields.push(fields[count - 1])
        }
      }

      // const useData = this.req.body.map(field => {
      //   if (Object.keys(field) !== 'itemNumber') {
      //     if (field !== null) return field;
      //   }
      // })

      // Collect data from request body
      const data = await this.parseReq("UPDATE")
      return await super.update(this.fields, useData)
    } catch (e) {
      //throw e;
      throw utils.errMsg(e)
    }
  }

  parseReq(method) {
    const primaryData = [this.req.body.itemNumber]
    const fieldData = [
      this.req.body.mfgItemNumber || this.req.body.itemNumber,
      this.req.body.brandName,
      this.req.body.productTitle,
      this.req.body.productType,
      this.req.body.styleCode,
      this.req.body.colorCode,
      this.req.body.color,
      this.req.body.size,
      this.req.body.upc,
      this.req.body.alternateUpc,
      this.req.body.cost,
      this.req.body.msrp,
      this.req.body.note,
      this.req.body.amazonSku,
      this.req.body.amazonAsin,
      this.req.body.amazonFnsku,
      this.req.body.ebaySku,
    ]
    return method === "CREATE" ? primaryData.concat(fieldData) : fieldData
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
    // // Item number exists already?
    // const itemNumber = data.itemNumber;
    // valError = await utils.primaryExists('Item Number', itemNumber, 'g3tools', 'item_master', 'item_number', method === 'UPDATE' ? this.id : null);
    // if (valError != '') return valError;

    // Item number unique in table?
    const itemNumber = data.itemNumber
    valError = await utils.fieldExists(
      "Item Number",
      itemNumber,
      "g3tools",
      "item_master",
      "item_number",
      "item_number",
      method === "UPDATE" ? this.id : null
    )
    if (valError != "") return valError

    // mfgItemNumber unique in table?
    const mfg = data.mfgItemNumber
    valError = await utils.fieldExists(
      "Mfg Item Number",
      mfg,
      "g3tools",
      "item_master",
      "mfg_item_number",
      "item_number",
      method === "UPDATE" ? this.id : null
    )
    if (valError != "") return valError

    // UPC unique in table?
    const upc = data.upc
    valError = await utils.fieldExists(
      "UPC",
      upc,
      "g3tools",
      "item_master",
      "upc",
      "item_number",
      method === "UPDATE" ? this.id : null
    )
    if (valError != "") return valError

    // SKU unique in table?
    const sku = data.amazonSku
    valError = await utils.fieldExists(
      "Amazon Sku",
      sku,
      "g3tools",
      "item_master",
      "amazon_sku",
      "item_number",
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
    // Only check for item number if creating a new record
    results = [
      body("itemNumber", `Item Number is required`)
        .exists()
        .not()
        .isEmpty()
        .trim()
        .unescape(),
    ]
  }
  results.concat([
    body("mfgItemNumber").trim().escape(),
    body("brandName", `Brand name is required`)
      .exists()
      .not()
      .isEmpty()
      .trim()
      .unescape(),
    body("productTitle", `Product title is required`)
      .exists()
      .not()
      .isEmpty()
      .trim()
      .unescape(),
    body("productType", `Product is required`)
      .exists()
      .not()
      .isEmpty()
      .trim()
      .unescape(),
    body("styleCode").trim().unescape(),
    body("colorCode").trim().unescape(),
    body("color").trim().unescape(),
    body("size").trim().unescape(),
    body("upc", `UPC is required`).exists().not().isEmpty().trim().unescape(),
    body("cost").trim().unescape().toFloat(),
    body("msrp").trim().unescape().toFloat(),
    body("note").trim().unescape(),
    body("amazonSku").trim().unescape(),
    body("amazonAsin").trim().unescape(),
    body("amazonFnsku").trim().unescape(),
    body("ebaySku").trim().unescape(),
  ])
  return results
}

module.exports = { ItemMaster, validate }
