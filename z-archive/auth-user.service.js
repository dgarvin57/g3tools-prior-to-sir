//const { Entity } = require('../db/entity.db ')
const BaseService = require("./base.service")
const utils = require("../utils")

/**
 * SERVICE: Abstract away from database in case we need to retrieve multiple
 * record types, etc.
 */
class AuthUserService extends BaseService {
  constructor() {
    super("User", "g3tools", "auth_user", page, limit, orderBy, orderDir)
  }
}

/*
exports.itemsFindSome = async (page, limit, searchText, orderBy, orderDir) => {
  try {
    // Convert page/limit to limit/offset for mySql
    const pagination = utils.convertPagination(page, limit);
    // If no search text
    if (searchText === undefined) {
      // return all
      const dbResult = exports.itemsGetAll(page, limit, orderBy, orderDir);
      const result = utils.convertDbCols(dbResult);
      return result;
    }
    // Get db results
    const dbResult = await itemMasterDb.itemsFindSome(pagination.limit, pagination.offset, searchText, orderBy, orderDir)
    if (typeof (dbResult) === 'string' && dbResult.includes('No matches')) return dbResult;
    const results = utils.convertDbCols(dbResult.results);

    // Calculate prev and next pages and package total rows and results
    const done = utils.paginationNextPrev(dbResult.totalRows, page, dbResult.offset, limit, results, searchText);
    return done;
  } catch (e) {
    throw e;
  }
}

exports.itemsGetOne = async (id) => {
  try {
    // Get db results
    const dbResult = await itemMasterDb.itemsGetOne(id);
    if (typeof (dbResult) === 'string' && dbResult.includes('No matches')) return dbResult;
    // Got results
    const result = utils.convertDbCols(dbResult);
    return result;
  } catch (e) {
    throw e;
  }
}

exports.itemsCreate = async (data) => {
  try {
    // Get db results
    const dbResult = await itemMasterDb.itemsCreate(data);
    // Return created record
    const result = utils.convertDbCols(dbResult);
    return result;
  } catch (e) {
    throw e;
  }
}

exports.itemsUpdate = async (id, data) => {
  try {
    // Get db results
    const dbResult = await itemMasterDb.itemsUpdate(id, data)
    // Return updated record
    const result = utils.convertDbCols(dbResult);
    return result;
  } catch (e) {
    throw e;
  }
}

exports.itemsDelete = async (id) => {
  try {
    // Get db results
    return await itemMasterDb.itemsDelete(id)
  } catch (e) {
    throw e;
  }
}
*/
/**
 * Given data for record, validate across fields, for example,
 * the following fields need to be unique besides the primary key (item_number):
 * UPC, SKU, and mfg_item_number, etc.
 * @param {JSON} data Fields and data for this record
 * @returns {string} Empty if validated and error message if not
 */
exports.tableValidation = async data => {
  let valError
  // Item number exists already?
  const itemNumber = data.itemNumber
  valError = await dbUtils.primaryExists(
    "Item Number",
    itemNumber,
    "g3tools",
    "item_master",
    "item_number"
  )
  //valError = await itemMasterDb.primaryExists(itemNumber);
  if (valError != "") return valError

  // mfgItemNumber unique in table?
  const mfg = data.mfgItemNumber
  valError = await dbUtils.fieldExists(
    "Mfg Item Number",
    mfg,
    "g3tools",
    "item_master",
    "mfg_item_number",
    "item_number"
  )
  if (valError != "") return valError

  // UPC unique in table?
  const upc = data.upc
  valError = await dbUtils.fieldExists(
    "UPC",
    upc,
    "g3tools",
    "item_master",
    "upc",
    "item_number"
  )
  if (valError != "") return valError

  // SKU unique in table?
  const sku = data.amazonSku
  valError = await dbUtils.fieldExists(
    "Amazon Sku",
    sku,
    "g3tools",
    "item_master",
    "amazon_sku",
    "item_number"
  )
  if (valError != "") return valError

  return ""
}
