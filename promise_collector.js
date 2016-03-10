const promises = [];

// Save promise into array
const collectPromise = (promise) => {
  promises.push(promise);
  return promise;
};

// Return a promise of all the promises currently in the array
const collectedPromises = () => Promise.all(promises);

module.exports = {collectPromise, collectedPromises};
