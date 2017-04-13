'use strict'

const os = require('os')
const path = require('path')
const series = require('async/series')
const IPFS = require('ipfs')
const topic = "general"
var nodeData

/*
 * Create a new IPFS instance, using default repo (fs) on default path (~/.ipfs)
 */
const node = new IPFS({
  repo: path.join(os.tmpdir() + '/' + new Date().toString()),
  init: false,
  start: false,
  EXPERIMENTAL: {
    pubsub: true
  }
})

series([
  /*
   * Display version of js-ipfs
   */
  (cb) => {
    node.version((err, version) => {
      if (err) { return cb(err) }

      console.log('IPFS Version:', version.version)
      cb()
    })
  },
  /*
   * Initialize the repo for this node
   */
  (cb) => node.init({ emptyRepo: true, bits: 2048 }, cb),
  /*
   * Take the node online (bitswap, network and so on)
   */
  (cb) => node.start(cb),
  /*
   * Add a file to IPFS - Complete Files API on:
   * https://github.com/ipfs/interface-ipfs-core/tree/master/API/files
   */
  (cb) => {
    if (node.isOnline()) {
      console.log('\nNode is now ready and online')
    }
    node.id(function(err, data){
      console.log("Node info:", data)
      nodeData = data
    })


    const receiveMsg = (msg) => {
      console.log(msg.data.toString());

      var dataObj = JSON.parse(msg.data.toString())
      console.log("node id", dataObj.node.id);

    }
    node.pubsub.subscribe(topic, receiveMsg);
    cb()

  },
  /*
   * Awesome we've subscribed to a topic so let's publish
   * some data via IPFS
   */
  (cb) => {

    var msgSend;
    var counter = 0
    setInterval(function(){
      var msgObj = {
        node: nodeData,
        counter: counter
      }
      // msgSend = new Buffer(counter.toString());
      msgSend = new Buffer(JSON.stringify(msgObj).toString());
      node.pubsub.publish(topic, msgSend, (err) => {
        if (err) {
          throw err
        }
        // msg was broadcasted
      })
      counter++

      node.swarm.peers(function (err, peerInfos) {
          console.log("Peers: " + peerInfos.length)
        })

    }, 3000);

  }
], (err) => {
  if (err) {
    return console.log(err)
  }
  console.log('Success!')
})
