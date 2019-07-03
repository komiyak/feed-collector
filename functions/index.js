const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

const processScheduledFunction = () => {
  console.log('called')
}

exports.helloWorld = functions.https.onRequest((request, response) => {
  processScheduledFunction()
  response.send('Hello from Firebase!')
})

exports.scheduledFunction = functions.pubsub.schedule('every 90 minutes').onRun((context) => {
  processScheduledFunction()
  return true
})
