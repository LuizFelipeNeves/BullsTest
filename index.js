/* eslint-disable no-console */
// docker exec -it container-name redis-cli FLUSHALL

const cluster = require('cluster');
const { UI, setQueues } = require('bull-board');
const queue = require('bull')('Message Clients');
const app = require('express')();

const getClients = () => {
  const numWorkers = 8;
  const clients = [];
  for (let i = 0; i < numWorkers; i += 1) clients.push({ id: i });
  return clients;
};

const newClient = (data) => {
  // Fork a client and set a job
  cluster.fork();
  queue.add(data);
};

const processMaster = () => {
  // Dashboard
  setQueues([queue]);
  app
    .get('/', UI)
    .get('/create', (_req, res) => {
      newClient({ id: 'dynamic' });
      return res.send('Create');
    })
    .get('/message', async (_req, res) => res.json(queue.add({ id: 'create' })))
    .listen(5000);

  // Fetch a clients from database and start a new clients.
  getClients().forEach((data) => newClient(data));

  // When the worker dies.
  cluster.on('exit', (worker) => console.log(`worker ${worker.process.pid} died`),);
};

const processClient = () => {
  queue.process(async (job, jobDone) => {
    // Start Wpp Client
    console.log(
      'Job done by worker',
      cluster.worker.id,
      job.id,
      JSON.stringify(job.data),
    );
    jobDone();

    // finish a work
    queue.close();
  });

  queue.on('completed', (job) => job.remove());
};

if (cluster.isMaster) processMaster(queue);
else processClient(queue);
