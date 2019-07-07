const admin = require('firebase-admin')
const functions = require('firebase-functions')

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: functions.config().core.database_url
})

// noinspection JSUnusedLocalSymbols
const pj = (obj) => {
  return JSON.stringify(obj)
}

// noinspection JSUnusedLocalSymbols
const ppj = (obj) => {
  return JSON.stringify(obj, null, 2)
}

function parseDate(strDate) {
  return new Date(Date.parse(strDate))
}

const processScheduledFunction = async () => {
  const db = admin.firestore()

  // Fetching targets of a feed.
  const feeds = []

  await db.collection('feeds').get().then(querySnapshot => {
    querySnapshot.forEach(doc => {
      feeds.push({
        id: doc.id,
        data: doc.data()
      })
    })
  })

  // console.log(ppj(feeds))

  const gaxios = require('gaxios')
  const parseString = require('xml2js').parseString

  // Getting articles from the websites
  const batchData = []

  for (let feed of feeds) {
    const res = await gaxios.request({
      url: feed.data.url
    })

    parseString(res.data, (err, result) => {
      if (err) {
        console.error(err)
      } else {
        for (let entry of result.feed.entry) {
          batchData.push({
            id: entry.id[0],
            title: entry.title[0],
            summary: entry.summary[0]['_'],
            published: parseDate(entry.published[0]),
            tag: feed.id,
            link: entry.link[0]['$'].href
          })
        }
      }
    })
  }

  // console.log(ppj(batchData))

  // Process of batch writing.
  console.log('Batch process started')
  const crypto = require('crypto')
  const batch = db.batch()

  for (let data of batchData) {
    const shasum = crypto.createHash('sha1')
    shasum.update(data.id + functions.config().core.crypto_hash_salt)
    const documentId = shasum.digest('hex')

    const ref = db.collection('articles').doc(documentId)
    batch.set(ref, {
      title: data.title,
      summary: data.summary,
      publishedAt: data.published,
      link: data.link,
      tag: data.tag
    })
  }

  await batch.commit()
  console.log('Batch process ended')
}

exports.scheduledFunction = functions.pubsub.schedule('every 180 minutes').onRun((context) => {
  return processScheduledFunction()
})
