const path = require('path')
const publicIp = require('public-ip')
const internalIp = require('internal-ip')
const express = require('express')
const expressWs = require('express-ws')
const colours = require('colors/safe')

const CloudServer = require('./cloud-server.js')
const fsUtil = require('./util.js')

async function startServer ({ port, lockVars, perMessageDeflate }) {
  const app = express()
  const cloudServer = new CloudServer({ lockVars })

  app.disable('x-powered-by')
  expressWs(app, undefined, {
    wsOptions: { perMessageDeflate }
  })

  const oldIndexHtmlPath = path.resolve(__dirname, '../index.html')
  if (await fsUtil.exists(oldIndexHtmlPath)) {
    app.get('/', (req, res, next) => {
      res.sendFile(oldIndexHtmlPath)
    })
  }

  app.use(express.static(path.resolve(__dirname, '../static/'), {
    extensions: ['html', 'htm']
  }))

  app.ws('/', cloudServer.handleWsConnection)

  app.use((req, res) => {
    res.status(404).sendFile(path.resolve(__dirname, '../static/404.html'))
  })

  app.listen(port, async () => {
    console.log('Please consider donating to kokofixcomputers by going to github sponsors. Any amount is appreciated!')
    console.log(colours.green('Scratch Primitive Cloud Server is now running:'))
    console.log(`  • on your computer at ${colours.cyan(`ws://localhost:${port}/`)} (use this for testing)`)
    const privateIp = await internalIp.v4().catch(() => null)
    if (privateIp) {
      console.log(`  • locally within your network at ${colours.blue(`ws://${privateIp}:${port}/`)} (This may be incorrect.)`)
    }
    const ip = await publicIp.v4().catch(() => null)
    if (ip) {
      console.log(`  • publicly at ${colours.blue(`ws://${ip}:${port}/`)}, but ONLY if you've set up port forwarding on your router`)
    }
    console.log(colours.yellow(`Any route that is not websocket will be servced from static/ folder, which you can access in your browser at ${colours.blue(`http://localhost:${port}/`)}.`))
    console.log(colours.red('Press Control+C to stop the server.'))
  })
}

module.exports = startServer
