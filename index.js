
var EventEmitter = require('events').EventEmitter
  , inherits = require('inherits')
  , debug = require('debug')('geolocation')

var currentPosition
  , watchers = 0
  , watcherHandle
  , emitter = new EventEmitter()

emitter.setMaxListeners(0)

exports.options = {}

exports.getCurrentPosition = function (callback) {
  if (watchers && currentPosition) {
    process.nextTick(function () {
      callback(null, currentPosition)
    })
    return
  }

  navigator.geolocation.getCurrentPosition(function (position) {
    callback(null, position)
  }, function (error) {
    callback(error)
  }, exports.options)
}

exports.createWatcher = function (callback) {
  var watcher = new Watcher()

  if (callback) {
    watcher.on('change', callback)
  }

  watcher.start()

  return watcher
}

function Watcher() {
  EventEmitter.call(this)
  this.watching = false

  var self = this
  this.changeHandler = function (position) {
    self.emit('change', position)
  }
}
inherits(Watcher, EventEmitter)
exports.Watcher = Watcher

Watcher.prototype.start = function () {
  if (this.watching) return
  this.watching = true
  watchers++

  debug('start watcher')

  emitter.on('change', this.changeHandler)

  if (watchers === 1) {
    debug('start geolocation watch position')
    watcherHandle = navigator.geolocation.watchPosition(function (position) {
      currentPosition = position
      emitter.emit('change', position)
    }, function (error) {
      emitter.emit('error', error)
    }, this.options)
  }
}

Watcher.prototype.stop = function () {
  if (!this.watching) return
  this.watching = false
  watchers--

  emitter.removeListener('change', this.changeHandler)

  if (!watchers) {
    debug('clear geolocation watch')
    navigator.geolocation.clearWatch(watcherHandle)
  }
}
