const { parentPort } = require('worker_threads');

let isPaused = false;
let queue = [];
let highPrioQueue = [];

async function process() {
  if (isPaused || (queue.length === 0 && highPrioQueue.length === 0)) {
    return;
  }

  let messageId;
  if (highPrioQueue.length > 0) {
    messageId = highPrioQueue.shift();
  } else {
    messageId = queue.shift();
  }

  parentPort.postMessage({ status: 'processing', messageId: messageId });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  parentPort.postMessage({ status: 'completed', messageId: messageId });

  setImmediate(process);
}

parentPort.on('message', (command) => {
  switch (command.action) {
    case 'PUSH':
      if (command.priority == 'NORMAL') {
        queue.push(command.payload);
      }
      if (command.priority == 'URGENT') {
        highPrioQueue.push(command.payload);
      }
      process();
      break;

    case 'PAUSE':
      isPaused = true;
      parentPort.postMessage({ status: 'paused' });
      break;

    case 'RESUME':
      if (isPaused) {
        isPaused = false;
        parentPort.postMessage({ status: 'resumed' });
        process();
      }
      break;
  }
});
