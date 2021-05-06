const conn = require("./db-connection")
const mysql = require("mysql2/promise")
const utils = require("../utils")

class Schema {
  constructor(database, tablename) {
    this.database = database
    this.tablename = tablename
  }

  /**
   * Get columns with unique keys from table (omit id)
   */
  getUniqueKeys = async function () {
    let sql
    try {
      sql = `SELECT c.COLUMN_NAME as columnName, CASE WHEN c.IS_NULLABLE = 'NO' THEN TRUE ELSE FALSE END AS required, c.DATA_TYPE as dataType, c.CHARACTER_MAXIMUM_LENGTH as maxLength, c.COLUMN_TYPE as columnType, c.COLUMN_KEY as columnKey, c.COLUMN_COMMENT as columnComment FROM information_schema.COLUMNS c  WHERE c.TABLE_SCHEMA = '${this.database}' AND c.TABLE_NAME = '${this.tablename}' AND c.COLUMN_KEY = 'UNI' AND COLUMN_NAME <> 'id' ORDER BY c.ORDINAL_POSITION`
      sql = mysql.format(sql, id)
      const result = await conn.query(sql)
      const record = result[0]
      // No results?
      if (record.length === 0) return -1
      // Return results
      return result[0][0]
    } catch (e) {
      e.sql = sql
      throw e
    }
  }

  /**
   * Get columns that are not unique keys from table (omit id)
   */
  getNonUniqueColumns = async function () {
    let sql
    try {
      sql = `SELECT c.COLUMN_NAME as columnName, CASE WHEN c.IS_NULLABLE = 'NO' THEN TRUE ELSE FALSE END AS required, c.DATA_TYPE as dataType, c.CHARACTER_MAXIMUM_LENGTH as maxLength, c.COLUMN_TYPE as columnType, c.COLUMN_KEY as columnKey, c.COLUMN_COMMENT as columnComment FROM information_schema.COLUMNS c  WHERE c.TABLE_SCHEMA = '${this.database}' AND c.TABLE_NAME = '${this.tablename}' AND c.COLUMN_KEY <> 'UNI' AND COLUMN_NAME <> 'id' ORDER BY c.ORDINAL_POSITION`
      sql = mysql.format(sql, id)
      const result = await conn.query(sql)
      const record = result[0]
      // No results?
      if (record.length === 0) return -1
      // Return results
      return result[0][0]
    } catch (e) {
      e.sql = sql
      throw e
    }
  }

  /**
   * Get all columnsfrom table (omit id)
   */
  getAllColumns = async function () {
    let sql
    try {
      sql = `SELECT c.COLUMN_NAME as columnName, CASE WHEN c.IS_NULLABLE = 'NO' THEN TRUE ELSE FALSE END AS required, c.DATA_TYPE as dataType, c.CHARACTER_MAXIMUM_LENGTH as maxLength, c.COLUMN_TYPE as columnType, c.COLUMN_KEY as columnKey, c.COLUMN_COMMENT as columnComment FROM information_schema.COLUMNS c  WHERE c.TABLE_SCHEMA = '${this.database}' AND c.TABLE_NAME = '${this.tablename}' AND COLUMN_NAME <> 'id' ORDER BY c.ORDINAL_POSITION`
      sql = mysql.format(sql, id)
      const result = await conn.query(sql)
      const record = result[0]
      // No results?
      if (record.length === 0) return -1
      // Return results
      return result[0][0]
    } catch (e) {
      e.sql = sql
      throw e
    }
  }
}
