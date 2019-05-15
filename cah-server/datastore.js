const redis = require('redis').createClient(process.env.REDIS_URL);

// Redis client is wrapped inside another class to accomodate another datastore in the future
const client = redis;

class Datastore {
    static set(key, value) {
        const callback = (resolve, reject) => {
            client.set(key, value, (err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(reply);
                }
            });
        }

        return new Promise(callback);
    }

    static get(key) {
        const callback = (resolve, reject) => {
            client.get(key, (err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(reply);
                }
            });
        }

        return new Promise(callback);
    }
}

module.exports = Datastore;
