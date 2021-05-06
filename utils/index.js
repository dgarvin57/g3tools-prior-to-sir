const jwt = require("jsonwebtoken")
const conn = require("../3-db/db-connection")

// utility functions common to the project go here

exports.convertPagination = function (page, limit) {
  // UI provdes page number and limit, like page 1, limit 25
  // MySql uses limit and offset, like 25, 0 (for page 1, limit 25)
  // For subsequent pages, mySql would need 25, 26 (for page 2, limit 25)
  const offset = page === 1 ? 0 : (page - 1) * limit + 1
  // Limit always stays the same
  return {
    limit: limit || 25,
    offset: offset || 0,
  }
}

/**
 * Given pagination results, calculate next and previous
 * @param {object} pagination Total rows, page, and limit
 * @returns {object} pagination object with next and previous (if needed)
 */
exports.paginationNextPrev = function (
  totalRows,
  page,
  offset,
  limit,
  dataResults,
  searchText
) {
  const usePage = offset === 0 ? 1 : page
  const startIndex = (usePage - 1) * limit
  const endIndex = usePage * limit

  const done = {}
  done.totalRows = totalRows
  done.currentRows = dataResults.length
  done.currentPage = usePage
  if (searchText != undefined) done.searchText = searchText
  done.maxPages = Math.ceil(totalRows / limit)

  // Next page?
  if (endIndex < totalRows) {
    done.next = {
      page: usePage + 1,
      limit: limit,
    }
  }

  // Previous page?
  if (startIndex > 0) {
    done.previous = {
      page: usePage - 1,
      limit: limit,
    }
  }

  //done.results = exports.convertDbCols(dataResults);
  done.results = dataResults
  return done
}

exports.errMsg = function (error) {
  let msg = error.message && error.message.replace(/'/g, "`")
  if (error.sql != undefined) {
    // Is error.sql an object?
    if (typeof error.sql === "string") {
      // sql is string
      msg = msg + "\r\nSQL: " + error.sql.replace(/'/g, "`") || ""
    } else if (typeof error.sql === "object") {
      // sql is object
      msg = msg + "\r\nSQL: " + JSON.stringify(error.sql) || ""
    }
  }
  return msg
}

/**
 * Build standard errors object to match express-validator
 */
exports.buildError = (location, param, value, msg) => {
  const errors = []
  errors.push({
    location: location,
    param: param,
    value: value,
    msg: msg,
  })
  return errors
}

/**
 * Capitalize the first character of the passed in string
 */
exports.capitalizeFirst = s => {
  if (typeof s !== "string") return ""
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Converts underscore (database) names to camel case format,
 * such as item_number to itemNumber
 * @param {string} name The string to be converted, like item_number
 * @returns {string} The converted string, like itemNumber
 */
exports.toCamelCase = name => {
  if (!name.includes("_")) return name

  let newName
  // Build new key name replacing _ with the next letter capitalized
  const words = name.split("_")
  for (i = 0; i < words.length; i++) {
    // For each word in key name
    word = words[i]
    if (i === 0) {
      newName = word
    } else {
      // Capitalize first letter of next word
      newName = newName + exports.capitalizeFirst(word)
    }
  }
  return newName
}

/**
 * Converts object with db names using underscores to camel case
 * @param {Object} data Data object where db names need to be converted to camel case
 * @returns {Object} Data object with camel case key names
 */
exports.convertDbCols = data => {
  if (Array.isArray(data)) {
    // data is an array
    const newArray = data.map(x => {
      return convertDbColsHelper(x)
    })
    return newArray
  } else if (typeof data === "string") {
    return data
  } else {
    // data is a single object
    return convertDbColsHelper(data)
  }

  return newData
}

function convertDbColsHelper(data) {
  let newData = {}
  Object.keys(data).forEach(key => {
    const newKey = exports.toCamelCase(key)
    const val = data[key]
    newData[newKey] = val
  })
  return newData
}

/**
 * Replace encoded <, > <=, and >=
 * @param {String} data
 */
exports.decodeLshOperators = data => {
  let newData = data
  newData.replace("[lt]", "<")
  newData.replace("[lte]", "<=")
  newData.replace("[gt]", ">")
  newData.replace("[gte]", ">=")

  return newData
}

// /**
//  * Validate: Does this record identifier already exist? This is the primary or a unique key for the table
//  * @param {string} fieldDescName Descriptive name of field being tested, like Item Number
//  * @param {string} valueToTest Data value, like 'ADI_test01-L'
//  * @param {string} database Database name to look in, like g3tools
//  * @param {string} tableName Database table name of field being tested, like item_master
//  * @param {string} colToTest Column name to be tested in table, like item_number
//  * @param {int} selfId Id of record to be omitted (so we don't report itself on updates)
//  * @returns {string} '' (empty string) if doesn't exist; error msg if it does
//  */
// exports.primaryExists = async (fieldDescName, valueToTest, database, tablename, colToTest, selfId) => {
//   let sql;
//   try {
//     // Do we exclude self?
//     const selfSql = selfId == null ? '' : `AND id <> ${selfId}`;
//     // See if item exists
//     sql = `SELECT COUNT(*) AS count FROM ${database}.${tablename} a WHERE a.${colToTest} = '${valueToTest}' ${selfSql}`;
//     const exists = await conn.query(sql);
//     if (exists[0][0].count > 0) {
//       // Already exists: See if marked as deleted
//       sql = `SELECT COUNT(*) AS count FROM ${database}.${tablename} a WHERE a.${colToTest} = '${valueToTest}' ${selfSql} AND deleted = 1`;
//       const exists = await conn.query(sql);
//       let msg;
//       if (exists[0][0].count > 0) {
//         msg = `${fieldDescName} '${valueToTest}' exists but is marked as deleted`;;
//       } else {
//         msg = `${fieldDescName} '${valueToTest}' already exists`;;
//       }

//       return exports.buildError(`${database}.${tablename}`, colToTest, valueToTest, msg);
//     }
//     return '';
//   } catch (e) {
//     e.sql = sql;
//     throw e;
//   }
// }

/**
 * Validate: See if field already exists in table in another record
 * @param {string} fieldDescName Descriptive name of field being tested, like UPC
 * @param {string} valueToTest Data value, like 120033220002
 * @param {string} database Database name to look in, like g3tools
 * @param {string} tableName Database table name of field being tested, like item_master
 * @param {string} colToTest Column name to be tested in table, like upc
 * @param {string} identifierCol Name of column used to identify the record, like item_number
 * @param {string} field Field to test (unique key)
 * @param {int} selfId Id of record to be omitted (so we don't report itself on updates)
 * @returns {string} '' (empty string) if doesn't exist; error msg if it does
 */
exports.fieldExists = async (
  fieldDescName,
  valueToTest,
  database,
  tableName,
  colToTest,
  identifierCol,
  selfId
) => {
  let sql
  try {
    // Do we exclude self?
    const selfSql = selfId == null ? "" : `AND id <> ${selfId}`
    // See if field exists
    sql = `SELECT ${identifierCol}, deleted FROM ${database}.${tableName} a WHERE a.${colToTest} = '${valueToTest}' ${selfSql}`
    const exists = await conn.query(sql)
    // if (exists[0] === undefined) return '';
    // if (exists[0][0] === undefined) return '';
    const identifier = exists[0] && exists[0][0] && exists[0][0][identifierCol]
    if (identifier !== "" && identifier !== undefined) {
      // Already exists: See if this is deleted
      const deletedFlag = exists[0] && exists[0][0] && exists[0][0]["deleted"]
      let msg = ""
      if (deletedFlag) {
        // Marked as deleted
        // msg = `${fieldDescName} '${valueToTest}' exists in another record (${identifier}) but is marked as deleted`
        msg = `${fieldDescName} '${valueToTest}' already exists but is marked as deleted`
      } else {
        // msg = `${fieldDescName} '${valueToTest}' already exists in another record (${identifier})`
        msg = `${fieldDescName} '${valueToTest}' already exists`
      }
      return exports.buildError(
        `${database}.${tableName}`,
        colToTest,
        valueToTest,
        msg
      )
    }
    return ""
  } catch (e) {
    e.sql = sql
    throw e
  }
}
