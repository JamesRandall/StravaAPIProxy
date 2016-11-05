const express = require('express')
const path = require('path')
const logger = require('morgan')
const bodyParser = require('body-parser')
const cors = require('cors')
const proxy = require('express-http-proxy')
const tokenExchange = require('./routes/tokenExchange')
const home = require('./routes/index')
const app = express()

const stravaClientId = process.env.stravaClientId || 'yourid' // for example '12345'
const stravaClientSecret = process.env.stravaClientSecret || 'yoursecret' // for example '9876fe547238c1324bd...'

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// configuration
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())

// routes
app.use('/', home)
app.use('/tokenexchange', tokenExchange(stravaClientId, stravaClientSecret))
app.use('/strava', proxy('www.strava.com', {
    decorateRequest: function(proxyReq, originalReq) {
        for(const headerName in originalReq.headers) {
            // exclude the host header to prevent certificate chain issues
            if (headerName.toLowerCase() !== 'host') {
                proxyReq.headers[headerName] = originalReq.headers[headerName]
            }            
        }
    },
    filter: function(req) {
        // don't pass on cors handshaking
        return req.method !== 'OPTIONS'
    },
    https: true
}))

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err, req, res) => {
        res.status(err.status || 500)
        res.render('error', {
            message: err.message,
            error: err
        })
    })
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res) => {
    res.status(err.status || 500)
    res.render('error', {
        message: err.message,
        error: {}
    })
})


module.exports = app
