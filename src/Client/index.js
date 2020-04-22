const cluster = require('cluster')

const timeout = (delay, result) => {
	return new Promise((resolve) => {
		setTimeout(() => resolve('result'), delay)
	})
}

const processClient = (queue) => {
	console.log('Worker Started: ' + cluster.worker.id)

	queue.process(async (job, jobDone) => {
		// Start Wpp Client
		console.log('Processing Job by worker', cluster.worker.id, job.id, JSON.stringify(job.data))

		// Client started
		await Promise.all([timeout(100000)])

		job.progress(100)
		jobDone(null, { progress: 100 })

		// finish a work
		queue.close()
	})

	queue.on('completed', (job) => {
		console.log('Job completed by worker', cluster.worker.id, job.id, JSON.stringify(job.data))
		// job.remove()
		// process.exit()
	})
}

module.exports = processClient
