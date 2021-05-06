const conn = require("../3-db/db-connection")
const mysql = require("mysql2/promise")
const utils = require("../utils")

/**
 * Get all item master records
 * @param {int} limit Number of records to return at one time
 * @param {int} offset Position of results to start returning records
 * @param {string} orderBy Field to sort results by
 * @param {string} orderDir ASC / DESC
 */
exports.itemsGetAll = async function (limit, offset, orderBy, orderDir) {
  let sql
  try {
    const totalSql =
      "SELECT count(*) as total FROM g3tools.item_master im WHERE im.deleted = 0;"
    const total = await conn.query(totalSql)
    const useOffset = total[0][0].total > offset ? offset : 0
    // Get results
    sql = `SELECT * FROM g3tools.item_master im WHERE im.deleted = 0 ORDER BY ?? ${orderDir} LIMIT ? OFFSET ?;`
    sql = mysql.format(sql, [orderBy, limit, useOffset])
    const result = await conn.query(sql)
    const record = result[0]
    // No results?
    if (record.length === 0) return `No item master records to return`
    // Return results
    const dbResults = {
      totalRows: total[0][0].total,
      results: result[0],
      offset: useOffset,
    }
    return dbResults
  } catch (e) {
    e.sql = sql
    throw e
  }
}

/**
 * Get all item master records that match criteria
 * @param {int} limit Number of records to return at one time
 * @param {int} offset Position of results to start returning records
 * @param {string} searchText Find record by this search string
 * @param {string} orderBy Field to sort results by
 * @param {string} orderDir ASC / DESC
 */
exports.itemsFindSome = async function (
  limit,
  offset,
  searchText,
  orderBy,
  orderDir
) {
  let sql
  try {
    let args = [
      `%${searchText}%`,
      `%${searchText}%`,
      `%${searchText}%`,
      `%${searchText}%`,
      `%${searchText}%`,
      `%${searchText}%`,
      orderBy,
    ]

    // Total count
    const totalSql =
      "SELECT count(*) as total FROM g3tools.item_master im WHERE im.deleted = 0 AND (im.item_number LIKE ? OR im.amazon_sku LIKE ? OR im.product_title LIKE ? OR im.amazon_sku LIKE ? OR im.amazon_asin LIKE ? OR im.upc like ?);"
    const total = await conn.query(totalSql, args)
    const useOffset = total[0][0].total > offset ? offset : 0
    args.push(limit)
    args.push(useOffset)

    // Get results
    sql = `SELECT * FROM g3tools.item_master im WHERE im.deleted = 0 AND (im.item_number LIKE ? OR im.amazon_sku LIKE ? OR im.product_title LIKE ? OR im.amazon_sku LIKE ? OR im.amazon_asin LIKE ? OR im.upc like ?) ORDER BY ?? ${orderDir} LIMIT ? OFFSET ?;`

    sql = mysql.format(sql, args)
    const result = await conn.query(sql)
    const record = result[0]
    // No results?
    if (record.length === 0)
      return `No matches for search string: ${searchText}`
    // Return results
    const dbResults = {
      totalRows: total[0][0].total,
      results: result[0],
      offset: useOffset,
    }
    return dbResults
  } catch (e) {
    e.sql = sql
    throw e
  }
}

/**
 * Get item master by id
 * @param {int} id Id of record to search for
 */
exports.itemsGetOne = async function (id) {
  let sql
  try {
    sql = `SELECT * FROM g3tools.item_master im WHERE im.id = ?;`
    sql = mysql.format(sql, id)
    const results = await conn.query(sql)
    const record = results[0]
    // No results?
    if (record.length === 0) return `No matches for record id: ${id}`
    // Return results
    return results[0][0]
  } catch (e) {
    e.sql = sql
    throw e
  }
}

/**
 * Create an item master record
 * @param {Array} data Array of values to insert into each field
 */
exports.itemsCreate = async function (data) {
  let sql
  try {
    sql = `INSERT INTO g3tools.item_master (item_number, mfg_item_number, brand_name, product_title, product_type, style_code, color_code, color, size, upc, alternate_upc, cost, msrp, note, amazon_sku, amazon_asin, amazon_fnsku, ebay_sku) VALUES (?);`
    sql = mysql.format(sql, [data])
    const results = await conn.query(sql)
    const record = results[0]
    // No results?
    if (record.length === 0) return `No matches for record id: ${id}`
    // Return results
    return await exports.itemsGetOne(record.insertId)
  } catch (e) {
    e.sql = sql
    throw e
  }
}

/**
 * Updated an item master record by id
 * @param {int} id Id of record to update
 * @param {Array} data Array of values to update each field
 */
exports.itemsUpdate = async function (id, data) {
  let sql
  try {
    sql = `UPDATE g3tools.item_master im SET item_number = ?, mfg_item_number = ?, brand_name = ?, product_title = ?, product_type = ?, style_code = ?, color_code = ?, color = ?, size = ?, upc = ?, alternate_upc = ?, cost = ?, msrp = ?, note = ?, amazon_sku = ?, amazon_asin = ?, amazon_fnsku = ?, ebay_sku = ? WHERE im.id = ${id};`
    sql = mysql.format(sql, data)
    const results = await conn.query(sql)
    const record = results[0]
    // No results?
    if (record.length === 0) return `No matches for record id: ${id}`
    // Return results
    return exports.itemsGetOne(id)
  } catch (e) {
    e.sql = sql
    throw e
  }
}

/**
 * Delete item master by id
 * @param {int} id Id of record to search for
 */
exports.itemsDelete = async function (id) {
  let sql
  try {
    sql = `DELETE FROM g3tools.item_master WHERE id = ?;`
    sql = mysql.format(sql, id)
    const results = await conn.query(sql)
    const record = results[0].affectedRows
    // No results?
    if (record === 0 || record === undefined)
      return `Problem with deleting record id: ${id}`

    // Return results

    return `Successfully deleted record id ${id}`
  } catch (e) {
    e.sql = sql
    throw e
  }
}

// /**
//  * Validate: Item master exists? This is the primary key for the table
//  * @param {string} itemNumber Item number to test (primary key)
//  * @returns {string} '' (empty string) if doesn't exist; error msg if it does
//  */
// exports.primaryExists = async function (itemNumber) {
//   let sql;
//   try {
//     // See if item exists
//     sql = `SELECT COUNT(*) AS count FROM g3tools.item_master im WHERE im.item_number = '${itemNumber}'`;
//     const exists = await conn.query(sql);
//     if (exists[0][0].count > 0) {
//       // Already exists
//       const msg = `Item '${itemNumber}' already exists`;;
//       return utils.buildError("g3tools.item_master", "item_number", itemNumber, msg);
//     }
//     return '';
//   } catch (e) {
//     e.sql = sql;
//     throw e;
//   }
// }

// /**
//  * Validate: UPC already exists (unique key of table)
//  * @param {string} upc UPC to test (unique key)
//  * @returns {string} '' (empty string) if doesn't exist; error msg if it does
//  */
// exports.upcExists = async function (upc) {
//   let sql;
//   try {
//     // See if item exists
//     sql = `SELECT item_number FROM g3tools.item_master im WHERE im.upc = '${upc}'`;
//     const exists = await conn.query(sql);
//     if (exists[0] === undefined) return '';
//     if (exists[0][0] === undefined) return '';
//     const itemNumber = exists[0][0].item_number;
//     if (itemNumber !== '') {
//       // Already exists
//       const msg = `UPC '${upc}' already exists in another item record (${itemNumber})`;
//       return utils.buildError("g3tools.item_master", "upc", upc, msg);
//     }
//     return '';
//   } catch (e) {
//     e.sql = sql;
//     throw e;
//   }
// }

// /**
//  * Validate: SKU already exists (unique key of table)
//  * @param {string} sku SKU to test (unique key)
//  * @returns {string} '' (empty string) if doesn't exist; error msg if it does
//  */
// exports.skuExists = async function (sku) {
//   let sql;
//   try {
//     // See if item exists
//     sql = `SELECT item_number FROM g3tools.item_master im WHERE im.amazon_sku = '${sku}'`;
//     const exists = await conn.query(sql);
//     if (exists[0] === undefined) return '';
//     if (exists[0][0] === undefined) return '';
//     const itemNumber = exists[0][0].item_number;
//     if (itemNumber !== '') {
//       // Already exists
//       const msg = `Amazon Sku '${sku}' already exists in another item record (${itemNumber})`;
//       return utils.buildError("g3tools.item_master", "amazon_sku", sku, msg);
//     }
//     return '';
//   } catch (e) {
//     e.sql = sql;
//     throw e;
//   }
// }
