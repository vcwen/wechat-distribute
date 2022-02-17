// import micromatch from 'micromatch'
// const event = new RegExp('event', 'i')
// const eventScan = new RegExp('event.scan', 'i')
// console.log(event.test('event'), event.test('event.scan'), event.test('text'))
// console.log(eventScan.test('event'), eventScan.test('event.scan'), eventScan.test('text'))
// console.log(micromatch.all('event.scan', ['event.*', '!event.scan']))
// import https from 'http'

// const request = https.request(new URL('http://localhost:4000?foo=bar'), { method: 'POST' }, (res) => {
//   console.log(res.statusCode)
//   res.on('data', (chunk) => console.log(chunk.toString()))
//   res.on('end', () => console.log('response end'))
// })
// request.write('hi there')

// request.end()

// request.on('error', (err) => console.error(err))
// request.on('finish', () => {
//   console.log('request finish>>>')
// })

const a = new URL('http://test.com?name=vc')
const b = new URL('http://abc.com')
b.search = a.search
console.log(b.searchParams)

import { match } from 'path-to-regexp'
const matchPath = match<{ appId: string }>('/apps/:appId')
const result = matchPath('/apps')
if (result) {
  console.log(result.params.appId)
} else {
  console.log('not match')
}
