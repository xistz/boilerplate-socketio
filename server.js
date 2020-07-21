'use strict';

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const auth = require('./app/auth.js');
const routes = require('./app/routes.js');
const mongo = require('mongodb').MongoClient;
const passport = require('passport');
const cookieParser = require('cookie-parser');
const app = express();
const http = require('http').Server(app);
const sessionStore = new session.MemoryStore();
const cors = require('cors');
const io = require('socket.io')(http);
const passportSocketIo = require('passport.socketio');

fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.use(cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    key: 'express.sid',
    store: sessionStore,
  })
);

mongo.connect(
  process.env.DATABASE,
  { useUnifiedTopology: true },
  (err, client) => {
    if (err) console.log('Database error: ' + err);

    const db = client.db('socketio');

    auth(app, db);
    routes(app, db);

    http.listen(process.env.PORT || 3000);

    //start socket.io code
    let currentUsers = 0;

    io.use(
      passportSocketIo.authorize({
        cookieParser: cookieParser,
        key: 'express.sid',
        secret: process.env.SESSION_SECRET,
        store: sessionStore,
      })
    );

    io.on('connection', (socket) => {
      currentUsers++;
      console.log('A user has connected');
      console.log('user ' + socket.request.user.name + ' connected');

      io.emit('user', {
        name: socket.request.user.name,
        currentUsers,
        connected: true,
      });

      socket.on('chat message', (chatMessage) => {
        io.emit('chat message', {
          name: socket.request.user.name,
          chatMessage,
        });
      });

      socket.on('disconnect', () => {
        /*anything you want to do on disconnect*/
        currentUsers--;
        io.emit('user count', currentUsers);
      });
    });

    //end socket.io code
  }
);
