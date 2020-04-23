/* eslint-disable no-console */
// docker exec -it container-name redis-cli FLUSHALL

const cluster = require('cluster')
const { UI, setQueues } = require('bull-board')
require('dotenv').config()

const config = {
	redis: {
		port: process.env.redis_port || 6379,
		host: process.env.redis_host || '127.0.0.1',
		password: process.env.redis_password ||null
	}
}


const queue = require('bull')('Message Clients', config);

const processClient = require('./src/Client')

const app = require('express')()

const getClients = () => {
	const numWorkers = 8
	const clients = []
	for (let i = 0; i < numWorkers; i += 1) clients.push({ id: i })
	return clients
}

const newWorker = (data) => {
	// Fork a client and set a job
	cluster.fork()
	queue.add(data)
}

const processMaster = () => {
	console.log('Master Started')

	// Dashboard
	setQueues([queue])
	app
		.use('/', UI)
		.post('/create', (_req, res) => {
			// valid all and check
			// all data to start a client

			newWorker({ id: 'dynamic' })
			return res.send('Create')
		})
		.get('/message', async (_req, res) => {
			return res.json(queue.add({ id: 'create' }))
		})
		.listen(5000)

	// Fetch a clients from database and start a new clients.
	getClients().forEach((data) => newWorker(data))
}

if (cluster.isMaster) processMaster(queue)
else processClient(queue)
