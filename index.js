const {LocalDate, nativeJs} = require("@js-joda/core");
const {generateSlug} = require("random-word-slugs");
const { Client } = require('pg')

const NUM_ASSUMPTIONS = 1000
const NUM_ROWS = 100000
const SCHEMA = 'test-big'
const TBL_NAME = 'entity_values'
const client = new Client({
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'dbName'
})

function genRandNum(min = 1, max = 10000, precision = 0) {
  const seed = Math.random()*(max-min) + min
  const power = Math.pow(10, precision)
  return Math.floor(seed*power) / power
}

function genRandDate(start = new Date('1970-01-01'), end = new Date('2099-12-31')) {
  return new Date(genRandNum(start.getTime(), end.getTime()))
}

const types = [{
  type: 'decimal',
  gen: () => genRandNum(1, 1000000, genRandNum(0, 8))
}, {
  type: 'date',
  gen: () => LocalDate.from(nativeJs(genRandDate())).toString()
}, {
  type: 'word',
  gen: () => generateSlug(1)
}, {
  type: 'title',
  gen: () => generateSlug(genRandNum(1, 5), { format: 'title' })
}, {
  type: 'sentence',
  gen: () => generateSlug(genRandNum(1, 15), { format: 'sentence' })
}]

const main = async () => {
  try {
    await client.connect()

    await client.query(`DELETE FROM "${SCHEMA}"."${TBL_NAME}"`)

    const schema = []
    for (let ass = 1; ass <= NUM_ASSUMPTIONS; ass++) {
      schema.push(genRandNum(0, types.length - 1))
    }
    console.log(schema)

    for (let row = 1; row <= NUM_ROWS; row++) {
      const rowJsonb = {}
      for (let i = 0; i < schema.length; i++) {
        rowJsonb[i+1] = types[schema[i]].gen()
      }
      const insertSql = `INSERT INTO "${SCHEMA}"."${TBL_NAME}" (id, values) VALUES (${row}, '${JSON.stringify(rowJsonb)}')`
      // console.log(insertSql)
      console.log(`Inserting row ${row}`)
      await client.query(insertSql)
    }
  } finally {
    client.end()
  }
}

void main()

// for (let i = 0; i < 10; i++) {
//   console.log(types[genRandNum(0, types.length-1)].gen())
// }