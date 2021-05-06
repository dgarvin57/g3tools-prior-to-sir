const utils = require("../utils")
const BaseDb = require("../3-db/base.db ")

/**
 * SERVICE: Base class for service code. Abstracted one layer away from
 * the database, in case we need to pull multiple entities into one.
 */

class BaseService {
  constructor(entityType, database, tablename, page, limit, orderBy, orderDir) {
    this.page = page
    this.limit = limit
    // Instantiate base database class
    this.baseDb = new BaseDb(
      entityType,
      database,
      tablename,
      page,
      limit,
      orderBy,
      orderDir
    )
  }

  /*
   * if you need to make calls to additional tables, data stores (Redis, for example),
   * or call an external endpoint as part of creating the blogpost, add them to this service
   */
  getAll = async () => {
    try {
      // Convert page/limit to limit/offset for mySql
      const pagination = utils.convertPagination(this.page, this.limit)
      // Get db results
      const dbResult = await this.baseDb.getAll(
        pagination.limit,
        pagination.offset,
        orderBy,
        orderDir
      )
      if (typeof dbResult === "string" && dbResult.includes("No matches"))
        return dbResult
      const results = utils.convertDbCols(dbResult.results)

      // Calculate prev and next pages and package total rows and results
      const done = utils.paginationNextPrev(
        dbResult.totalRows,
        page,
        dbResult.offset,
        limit,
        results
      )
      return done
    } catch (e) {
      throw e
    }
  }
}

module.exports = BaseService
