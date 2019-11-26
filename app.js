const express = require('express')
const fetch = require('node-fetch');
const htmlParser = require('node-html-parser')
var cors = require('cors')

const app = express()
app.use(cors())
const port = 3000

function parseField(htmlStr, type) {
  let response = {}
  htmlStr = htmlStr.replace(/(\r\n|\n|\r)/gm, "")
  const root = htmlParser.parse(htmlStr)
  let rows = Array.from(root.querySelectorAll('tr'))
    .map(r => r.text.trim())
    .filter(v => v)

  if (type == 'announcement') {
    return rows
  }

  rows = rows.filter(v => v.includes(':'))

  if (type == 'action') {
    rows.shift()
  }

  rows.forEach(v => {
    [key, value] = v.split(':')
    response[key.trim()] = value.trim()
  })

  return response
}

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/api/search', (req, res) => {
  const SYMBOL = req.query.symbol
  const urls = [
    `https://www1.nseindia.com/marketinfo/companyTracker/corpAction.jsp?symbol=${SYMBOL}`,
    `https://www1.nseindia.com/marketinfo/companyTracker/compInfo.jsp?symbol=${SYMBOL}&series=EQ`,
    `https://www1.nseindia.com/marketinfo/companyTracker/corpAnnounce.jsp?symbol=${SYMBOL}`
  ]
  const promises = urls.map(url => fetch(url).then(res => res.text()))

  Promise.all(promises)
    .then(body => {
      [action, info, announce] = body
      return res.send({
        info: parseField(info),
        action: parseField(action, 'action'),
        announce: parseField(announce, 'announcement')
      })
    });
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))