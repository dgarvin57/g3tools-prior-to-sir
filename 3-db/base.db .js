const conn = require("./db-connection")
const mysql = require("mysql2/promise")
const utils = require("../utils")

class BaseDb {
  /**
   *
   * @param {*} entityType Entity name, like "User"
   * @param {*} database Database name entity table is found in
   * @param {*} tablename Entity database table name
   * @param {int} limit Number of records to return at one time
   * @param {int} offset Position of results to start returning records
   * @param {string} orderBy Field to sort results by
   * @param {string} orderDir ASC / DESC
   * @param {string} seachText Find record by this search term
   * @param {int} deleted [0] = Omit deleted records; 1 = Show deleted records; 2 = Show all
   */
  constructor(
    entityType,
    database,
    tablename,
    offset,
    limit,
    orderBy,
    orderDir,
    deleted
  ) {
    this.entityType = entityType
    this.database = database
    this.tablename = tablename
    this.limit = limit
    this.offset = offset
    this.orderBy = orderBy
    this.orderDir = orderDir
    this.deleted = deleted
  }

  /**
   * Get results of passed in query
   * FROM clause must use "a" as table mnemonic
   */
  getQuery = async function (query) {
    let sql = ""
    try {
      // Construct sql
      let baseSql = ""
      // FROM
      baseSql = baseSql.concat(` ${query.from} `)
      // JOIN
      baseSql = baseSql.concat(query.join !== "" ? ` ${query.join} ` : "")
      // WHERE
      const deleted = this.deleted === 1 ? " a.deleted = 1" : " a.deleted = 0"
      const whereClause =
        query.where != ""
          ? `${query.where} AND ${deleted}`
          : ` WHERE ${deleted}`
      baseSql = baseSql.concat(whereClause)
      // GROUP BY
      baseSql = baseSql.concat(` GROUP BY ${query.groupBy} `)

      // Get total results and calculate limit
      if (query.groupBy !== "") {
        // Wrap group by for real total
        sql = `SELECT COUNT(*) as total FROM ( ${query.select} ${baseSql} ) b`
      } else {
        sql = `SELECT count(*) as total ${baseSql}`
      }
      const total = await conn.query(sql)
      const useOffset = total[0][0].total > this.offset ? this.offset : 0

      // Get all records based on passed in query
      let fullSql = ""
      if (query.order !== "") {
        fullSql = `${query.select} ${baseSql} ORDER BY ${query.order} LIMIT ? OFFSET ?;`
        sql = mysql.format(fullSql, [this.limit, useOffset])
      } else {
        fullSql = `${query.select} ${baseSql} LIMIT ? OFFSET ?;`
        sql = mysql.format(fullSql, [this.limit, useOffset])
      }

      const result = await conn.query(sql)
      const record = result[0]
      // No results?
      if (record.length === 0) return -1
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
   * Get all records of the given entity
   */

  getAll = async function () {
    let sql
    try {
      // WHERE clause to include deleted?
      let whereClause = ""
      if (this.deleted === 0) whereClause = "WHERE a.deleted = 0"
      if (this.deleted === 1) whereClause = "WHERE a.deleted = 1"

      const totalSql = `SELECT count(*) as total FROM ${this.database}.${this.tablename} a ${whereClause};`
      const total = await conn.query(totalSql)
      const useOffset = total[0][0].total > this.offset ? this.offset : 0

      // Get results
      sql = `SELECT * FROM ${this.database}.${this.tablename} a ${whereClause} ORDER BY ?? ${this.orderDir} LIMIT ? OFFSET ?;`
      sql = mysql.format(sql, [this.orderBy, this.limit, useOffset])
      const result = await conn.query(sql)
      const record = result[0]
      // No results?
      if (record.length === 0) return -1
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
   * Get all entity records that match criteria
   * @param {string} searchText Search term to find records by
   * @param {array} searchFields An array of fields to search on
   */
  findSome = async function (searchText, searchFields, filter) {
    let sql
    let args = []
    try {
      // Build criteria sql (for each string in searchFields, build sql)
      let criteriaResult = ""
      if (searchText !== "") {
        const arrSearchFields = Array.isArray(searchFields)
          ? searchFields
          : [searchFields]
        arrSearchFields.map(x => {
          if (criteriaResult === "") {
            criteriaResult += `(a.${x} LIKE ? `
          } else {
            criteriaResult += ` OR ${x} LIKE ?`
          }
          // Add searchText into an array of arguments to match the number of search fields
          args.push(`%${searchText}%`)
        })
      }

      // WHERE clause to include deleted?
      let whereClause = criteriaResult !== "" ? ") AND " : ""
      if (this.deleted === 0) whereClause = `${whereClause} a.deleted = 0`
      if (this.deleted === 1) whereClause = `${whereClause} a.deleted = 1`
      // Include filter if there
      if (filter !== "" && whereClause !== "")
        whereClause = `${whereClause} AND ${filter} `
      if (filter !== "" && whereClause === "") whereClause = filter

      // Total count
      const totalSql = `SELECT count(*) as total FROM ${this.database}.${this.tablename} a WHERE ${criteriaResult} ${whereClause};`
      // Only use args if any exists
      let total = 0
      if (args.length > 0) {
        total = await conn.query(totalSql, args)
      } else {
        total = await conn.query(totalSql)
      }

      const useOffset = total[0][0].total > this.offset ? this.offset : 0
      // Add additional arguments
      args.push(this.orderBy)
      args.push(this.limit)
      args.push(useOffset)

      // Get results
      sql = `SELECT * FROM ${this.database}.${this.tablename} a WHERE ${criteriaResult} ${whereClause} ORDER BY ?? ${this.orderDir} LIMIT ? OFFSET ?;`

      sql = mysql.format(sql, args)
      // console.log('sql', sql)
      const result = await conn.query(sql)
      const record = result[0]
      // No results?
      if (record.length === 0) return -1
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
   * Get an entity record by id
   * @param {int} id Id of record to search for
   */
  getOneById = async function (id) {
    let sql
    try {
      sql = `SELECT * FROM ${this.database}.${this.tablename} a WHERE a.id = ?;`
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
   * Get an entity record by id
   * @param {int} fieldName Column name to search in
   * @param {int} fieldValue Column value to search for
   */
  getOneByName = async function (fieldName, fieldValue) {
    let sql
    try {
      // WHERE clause to include deleted?
      let whereClause = ""
      if (this.deleted === 0) whereClause = "AND a.deleted = 0"
      if (this.deleted === 1) whereClause = "AND a.deleted = 1"

      sql = `SELECT * FROM ${this.database}.${this.tablename} a WHERE a.${fieldName} = ? ${whereClause};`
      sql = mysql.format(sql, fieldValue)
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
   * Create an entity record
   * @param {array} fields Fields to insert into
   * @param {Array} data Array of values to insert into each field (same order as fields)
   */
  create = async function (fields, data) {
    let sql
    console.log("base.db.create", data)
    try {
      // Parse on duplicate key portion: col1 = VALUES(col1), col2 = VALUES(col2), etc.
      let updateList = ""
      for (let field of fields) {
        if (updateList != "") updateList += ", "
        updateList += `${field} = VALUES(${field})`
      }
      // 1/20/21: Do not try UPSERT. If it finds abbreviation match, it will change brand name
      sql = `INSERT INTO ${this.database}.${this.tablename} (${fields.join(
        ", "
      )}) VALUES (?);`
      // sql = `INSERT INTO ${this.database}.${this.tablename} (${fields.join(
      //   ", "
      // )}) VALUES (?) ON DUPLICATE KEY UPDATE ${updateList};`
      sql = mysql.format(sql, [data])
      const results = await conn.query(sql)
      const record = results[0]
      // No results?
      if (record.affectedRows === 0) return -1
      // Return results (if item is updated rather than inserted, will return 0)
      return record.insertId
    } catch (e) {
      e.sql = sql
      throw e
    }
  }

  /**
   * Updated an entity record by id
   * @param {int} id Id of record to update
   * @param {array} fields Fields to insert into
   * @param {Array} data Array of values to update each field
   */
  update = async function (id, fields, data) {
    let sql
    try {
      const setList =
        fields.length > 1 ? `${fields.join(" = ?, ")} = ?` : `${fields[0]} = ?`
      sql = `UPDATE ${this.database}.${this.tablename} a SET ${setList} WHERE a.id = ${id};`
      sql = mysql.format(sql, data)
      const results = await conn.query(sql)
      const record = results[0]
      // No results?
      if (record.length === 0) return -1
      // Return results
      return id
    } catch (e) {
      e.sql = sql
      throw e
    }
  }

  /**
   * Delete an entity record by id
   * @param {int} id Id of record to search for
   */
  delete = async function (id) {
    let sql
    try {
      //const exists = await utils.primaryExists('id', id, this.database, this.tablename, 'id');
      const exists = await utils.fieldExists(
        "id",
        id,
        this.database,
        this.tablename,
        "id",
        "id"
      )
      if (exists === "") {
        return `No matches for ${this.entityType} id: ${id}`
      }
      sql = `UPDATE ${this.database}.${this.tablename} SET deleted = 1 WHERE id = ?;`
      sql = mysql.format(sql, id)
      const results = await conn.query(sql)
      const record = results[0].affectedRows
      // No results?
      if (record === 0 || record === undefined) return -1
      // Return results
      return `Successfully deleted record id: ${id}`
    } catch (e) {
      e.sql = sql
      throw e
    }
  }
}

module.exports = BaseDb
