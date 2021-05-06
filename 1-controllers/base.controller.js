const utils = require("../utils")
const BaseDb = require("../3-db/base.db ")
const { validationResult } = require("express-validator/check")
const config = require("../config")

/**
 * Base controller class:
 * 1. Parse request query string
 * 2. Handle pagination calculations
 * 3. Convert db column name format (underscore) to camelCase
 * 4. Abstract away from database layer
 */
class BaseController {
  constructor(
    req,
    res,
    entityType,
    database,
    tablename,
    searchFields,
    filter,
    orderBy
  ) {
    // Get data from request query string
    this.page = parseInt(req.query.page) || 1
    this.limit = parseInt(req.query.limit) || config.defaultRecordLimit
    this.orderBy = orderBy || req.query.orderBy || "id"
    this.orderDir = req.query.orderDir || "ASC"
    this.searchText = req.query.searchText || ""
    // this.filter = req.query.filter || ''
    this.filter = filter || ""
    this.deleted = parseInt(req.query.deleted) || 0
    this.id = req.params.id || ""
    this.req = req
    this.res = res
    this.searchFields = searchFields
    // Convert page/limit to limit/offset for mySql
    this.pagination = utils.convertPagination(this.page, this.limit)
    this.entityType = entityType

    // Instantiate base database class
    //this.offset = this.page === 1 ? 0 : this.page + 1;
    this.baseDb = new BaseDb(
      entityType,
      database,
      tablename,
      this.pagination.offset,
      this.pagination.limit,
      this.orderBy,
      this.orderDir,
      this.deleted
    )
  }

  /*
   * Get results of passed in query
   */
  async getQuery(query) {
    try {
      // Get db results
      const dbResult = await this.baseDb.getQuery(query)
      if (dbResult === -1) {
        return { result: `No ${this.entityType} records to return` }
      }
      const results = utils.convertDbCols(dbResult.results)

      // Calculate prev and next pages and package total rows and results
      const done = this.paginationNextPrev(dbResult.totalRows, results, this)
      return done
    } catch (e) {
      throw utils.errMsg(e)
    }
  }

  /*
   * Get all records
   */
  async getAll() {
    try {
      //      return await this.baseService.getAll()

      // Get db results
      const dbResult = await this.baseDb.getAll(
        this.pagination.limit,
        this.pagination.offset,
        this.orderBy,
        this.orderDir
      )
      if (dbResult === -1) {
        return { result: {} }
        // return { result: `No ${this.entityType} records to return` }
      }
      const results = utils.convertDbCols(dbResult.results)

      // Calculate prev and next pages and package total rows and results
      const done = this.paginationNextPrev(dbResult.totalRows, results, this)
      return done
    } catch (e) {
      throw utils.errMsg(e)
    }
  }

  /**
   * Find records that match search string in searchFields
   */
  async findSome() {
    let dbResult = ""
    try {
      const useFilter =
        this.filter !== undefined && this.filter !== "" ? this.filter : ""
      const useSearch =
        this.searchText !== undefined && this.searchText !== ""
          ? this.searchText
          : ""

      // If no search text nor filter...
      if (useSearch === "" && useFilter === "") {
        // No filter or search text: Return all
        dbResult = this.getAll()
        return dbResult
      } else if (useFilter !== "" && useSearch === "") {
        // Just filter text and no search text: Decode LSH and pass to findSome
        const decodedFilter = utils.decodeLshOperators(useFilter)
        dbResult = await this.baseDb.findSome("", "", decodedFilter)
      } else if (this.searchText !== "" && this.filter === "") {
        // Just searchText and no filter text: Pass to findSome
        dbResult = await this.baseDb.findSome(useSearch, this.searchFields, "")
      } else {
        // Both search text and filter
        dbResult = await this.baseDb.findSome(
          this.searchText,
          this.searchFields,
          this.filter
        )
      }

      if (dbResult === -1) {
        return {
          results: `No matches for ${this.entityType} using search string: ${this.searchText} or filter: ${this.filter}`,
        }
      }
      const results = utils.convertDbCols(dbResult.results)
      const done = this.paginationNextPrev(dbResult.totalRows, results, this)
      return done
    } catch (e) {
      throw e
      //throw utils.errMsg(e);
    }
  }

  /**
   * Find one record by id
   */
  async getOneById(id) {
    try {
      let useId
      if (id != undefined) {
        useId = id
      } else if (this.id != undefined) {
        useId = this.id
      } else {
        this.res.status(422).json("id is required")
      }
      const dbResult = await this.baseDb.getOneById(useId)
      if (dbResult === -1) {
        // Record with id not found
        return { results: `No matches for ${this.entityType} id: ${useId}` }
      }
      const results = utils.convertDbCols(dbResult)
      const done = this.paginationNextPrev(dbResult.totalRows, results, this)
      return done
    } catch (e) {
      throw e
      //throw e.message.replace(/'/g, "`") + '\r\nSQL: ' + e.sql.replace(/'/g, "`");
    }
  }

  /**
   * Find one record by unique field
   * @param {string} fieldName Name of column to search against
   * @param {int} fieldValue Value to use in where clause to search for
   * @returns {*} No results: -1. Otherwise, json object of record returned from db
   */
  async getOneByName(fieldName, fieldValue) {
    try {
      const dbResult = await this.baseDb.getOneByName(fieldName, fieldValue)
      if (dbResult === -1) {
        // Record with id not found
        return {
          status: -1,
          results: `No matches for ${this.entityType} ${fieldName}: ${fieldValue}`,
        }
      }
      this.res.status(200)
      const results = utils.convertDbCols(dbResult)
      const done = this.paginationNextPrev(dbResult.totalRows, results, this)
      return done
    } catch (e) {
      throw e
    }
  }

  async create(fields, data) {
    try {
      // Field validation
      const errors = validationResult(this.req)
      if (!errors.isEmpty()) {
        this.res.status(422).json({ errors: errors.array() })
        return
      }
      const dbResult = await this.baseDb.create(fields, data)
      if (dbResult === -1) {
        return { results: `No ${this.entityType} record inserted or updated` }
      }
      //return dbResult
      // Return results
      return await this.getOneById(dbResult)
    } catch (e) {
      throw e
      //throw utils.errMsg(e);
    }
  }

  async update(fields, data) {
    try {
      // Field validation
      const errors = validationResult(this.req)
      if (!errors.isEmpty()) {
        this.res.status(422).json({ errors: errors.array() })
        return
      }
      const dbResult = await this.baseDb.update(this.id, fields, data)
      if (dbResult === -1)
        return {
          results: `Error updating ${this.entityType} record id: ${this.id}`,
        }
      // Return results
      return await this.getOneById(dbResult)
    } catch (e) {
      //throw e;
      throw utils.errMsg(e)
    }
  }

  /**
   * Delete record. If id is passed, use that, otherwise use this.id passed in from parms
   * @param {int} id
   */
  async delete(id) {
    try {
      let useId
      if (id != undefined) {
        useId = id
      } else if (this.id != undefined) {
        useId = this.id
      } else {
        this.res.status(422).json("id is required")
      }

      const dbResult = await this.baseDb.delete(useId)
      if (dbResult === -1) {
        // Record with id not found
        return { results: `Problem with deleting ${this.entityType} id: ${id}` }
      }
      // Success
      return { results: dbResult }
    } catch (e) {
      //throw utils.errMsg(e);
      throw e
    }
  }

  /**
   * Calculate prev and next pages and package total rows and results
   * @param {*} totalRows
   * @param {*} results
   */
  paginationNextPrev = (totalRows, results, that) => {
    return utils.paginationNextPrev(
      totalRows,
      that.page,
      that.pagination.offset,
      that.pagination.limit,
      results,
      that.searchText
    )
  }
}

module.exports = BaseController
