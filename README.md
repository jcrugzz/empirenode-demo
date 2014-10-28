empirenode-demo
===============

Simple monitoring demo for removing servers from a pool

![](https://cldup.com/nPtdppw-uj.png)

1. Run all of the following in separate terminal windows.

```sh
node edge.js # edge-proxy server
node distributor.js # Updates the edge proxy based on commands it receives
node godot.js # Monitoring process that receives messages from app and tells distributor if action needs to be taken
```

1. Now start 2 apps to proxy requests to

```sh
node app.js -p 8080 &
node app.js -p 8081 &
```

1. Now run some curls, kill a process and watch the behavior as you continue to curl.

```sh

curl localhost:3000
curl localhost:3000
curl localhost:3000

kill <pid-number>

curl localhost:3000
curl localhost:3000
curl localhost:3000

```

You will see the server you killed automatically be removed from the pool as you watch the logs of the `edge.js` proxy
