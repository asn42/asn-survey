// The env variables FORTYTWO_CLIENT_ID and FORTYTWO_CLIENT_SECRET must be set.

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

var sqlite3 = require('sqlite3').verbose();

var passport = require('passport');
var FortyTwoStrategy = require('passport-42').Strategy;
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

passport.use(new FortyTwoStrategy(
  {
    clientID: process.env.FORTYTWO_CLIENT_ID,
    clientSecret: process.env.FORTYTWO_CLIENT_SECRET,
    callbackURL: 'https://asn.borntocode.in/login/42/return'
  },
  function (accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
  }
));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

// Create the database if it doesn't exist
function createDatabase(db) {
  db.run('CREATE TABLE IF NOT EXISTS survey(' +
    'username VARCHAR PRIMARY KEY, ' +
    'implication_follow BOOLEAN, ' +
    'implication_attend BOOLEAN, ' +
    'implication_facilitate BOOLEAN, ' +
    'implication_organize BOOLEAN, ' +
    'interest_hacking BOOLEAN, ' +
    'interest_privacy BOOLEAN, ' +
    'interest_floss BOOLEAN, ' +
    'contribution_activity BOOLEAN, ' +
    'contribution_propose BOOLEAN, ' +
    'contribution_ask BOOLEAN, ' +
    'contribution_help BOOLEAN, ' +
    'other TEXT);');
}

// Create a new Express application.
var app = express();

// Configure view engine to render handlebars templates.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ resave: false, saveUninitialized: false, secret: '!terceS' }));
//app.use(express.static(path.join(__dirname, 'public')));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// Routes

// Define routes.
app.get('/',
  function (req, res) {
    res.render('home', { user: req.user });
  });

app.get('/login',
  passport.authenticate('42'));

app.get('/login/42/return',
  passport.authenticate('42', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  });

app.get('/results',
  ensureLoggedIn(),
  function (req, res, next){
    var db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));
    db.serialize(function () {
      createDatabase(db);
      db.get('SELECT ' +
        'COUNT(CASE implication_follow WHEN 1 THEN implication_follow END) ' +
        'AS implication_follow, ' +
        'COUNT(CASE implication_attend WHEN 1 THEN implication_attend END) ' +
        'AS implication_attend, ' +
        'COUNT(CASE implication_facilitate WHEN 1 THEN ' +
        'implication_facilitate END) AS implication_facilitate, ' +
        'COUNT(CASE implication_organize WHEN 1 THEN implication_organize ' +
        'END) AS implication_organize, ' +
        'COUNT(CASE interest_hacking WHEN 1 THEN interest_hacking END) ' +
        'AS interest_hacking, ' +
        'COUNT(CASE interest_privacy WHEN 1 THEN interest_privacy END) ' +
        'AS interest_privacy, ' +
        'COUNT(CASE interest_floss WHEN 1 THEN interest_floss END) ' +
        'AS interest_floss, ' +
        'COUNT(CASE contribution_activity WHEN 1 THEN contribution_activity ' +
        'END) AS contribution_activity, ' +
        'COUNT(CASE contribution_propose WHEN 1 THEN contribution_propose ' +
        'END) AS contribution_propose, ' +
        'COUNT(CASE contribution_ask WHEN 1 THEN contribution_ask END) ' +
        'AS contribution_ask, ' +
        'COUNT(CASE contribution_help WHEN 1 THEN contribution_help END) ' +
        'AS contribution_help ' +
        'FROM survey;',
        function (err, result) {
          if (err) {
            db.close();
            next(err);
          }
          if (result) {
            db.all('SELECT other FROM survey WHERE other IS NOT NULL;',
              function (dbErr, other) {
                if (dbErr) {
                  db.close();
                  next(dbErr);
                }
                if (other) {
                  db.close();
                  res.render('results', { user: req.user, result: result, other: other });
                }
              });
          }
        });
    });
  });

app.get('/mails',
  ensureLoggedIn(),
  function (req, res, next){
    if (req.user.username !== 'apachkof') {
      res.redirect('/survey');
    } else {
      var db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));
      db.serialize(function () {
        createDatabase(db);
        db.all('SELECT username FROM survey;', function (dbErr, full) {
          if (dbErr) {
            db.close();
            next(dbErr);
          }
          if (full) {
            db.close();
            res.render('mails', {
              user: req.user, full: full
            });
          }
        });
      });
    }
  });

app.get('/all_results',
  ensureLoggedIn(),
  function (req, res, next){
    if (req.user.username !== 'apachkof') {
      res.redirect('/survey');
    } else {
      var db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));
      db.serialize(function () {
        createDatabase(db);
        db.get('SELECT ' +
          'COUNT(CASE implication_follow WHEN 1 THEN implication_follow ' +
          'END) AS implication_follow, ' +
          'COUNT(CASE implication_attend WHEN 1 THEN implication_attend ' +
          'END) AS implication_attend, ' +
          'COUNT(CASE implication_facilitate WHEN 1 THEN ' +
          'implication_facilitate END) AS implication_facilitate, ' +
          'COUNT(CASE implication_organize WHEN 1 THEN implication_organize ' +
          'END) AS implication_organize, ' +
          'COUNT(CASE interest_hacking WHEN 1 THEN interest_hacking END) AS ' +
          'interest_hacking, ' +
          'COUNT(CASE interest_privacy WHEN 1 THEN interest_privacy END) AS ' +
          'interest_privacy, ' +
          'COUNT(CASE interest_floss WHEN 1 THEN interest_floss END) AS ' +
          'interest_floss, ' +
          'COUNT(CASE contribution_activity WHEN 1 THEN ' +
          'contribution_activity END) AS contribution_activity, ' +
          'COUNT(CASE contribution_propose WHEN 1 THEN contribution_propose ' +
          'END) AS contribution_propose, ' +
          'COUNT(CASE contribution_ask WHEN 1 THEN contribution_ask END) AS ' +
          'contribution_ask, ' +
          'COUNT(CASE contribution_help WHEN 1 THEN contribution_help END) ' +
          'AS contribution_help ' +
          'FROM survey;',
          function (err, result) {
            if (err) {
              db.close();
              next(err);
            }
            if (result) {
              db.all('SELECT * FROM survey;',
                function (dbErr, full) {
                  if (dbErr) {
                    db.close();
                    next(dbErr);
                  }
                  if (full) {
                    db.close();
                    res.render('all_results', {
                      user: req.user, result: result, full: full
                    });
                  }
                });
            }
          });
      });
    }
  });

app.get('/survey',
  ensureLoggedIn(),
  function (req, res, next){
    var db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));
    db.serialize(function () {
      createDatabase(db);
      db.get('SELECT ' +
        'implication_follow, ' +
        'implication_attend, ' +
        'implication_facilitate, ' +
        'implication_organize, ' +
        'interest_hacking, ' +
        'interest_privacy, ' +
        'interest_floss, ' +
        'contribution_activity, ' +
        'contribution_propose, ' +
        'contribution_ask, ' +
        'contribution_help, ' +
        'other ' +
        'FROM survey ' +
        'WHERE username=?;',
        req.user.username,
        function (err, result) {
          if (err) {
            db.close();
            next(err);
          }
          if (result) {
            db.close();
            res.render('survey', { user: req.user, result: result });
          } else {
            db.close();
            res.render('survey', { user: req.user, result: {} });
          }
        });
    });
    //res.render('survey', { user: req.user });
  });

app.post('/survey',
  ensureLoggedIn(),
  function (req, res){
    var db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));
    db.serialize(function () {
      createDatabase(db);
      db.run('INSERT OR REPLACE INTO ' +
        'survey(username, ' +
        'implication_follow, ' +
        'implication_attend, ' +
        'implication_facilitate, ' +
        'implication_organize, ' +
        'interest_hacking, ' +
        'interest_privacy, ' +
        'interest_floss, ' +
        'contribution_activity, ' +
        'contribution_propose, ' +
        'contribution_ask, ' +
        'contribution_help, ' +
        'other) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', [
          req.user.username,
          /follow/.test(req.body.implication) ? 1 : null,
          /attend/.test(req.body.implication) ? 1 : null,
          /facilitate/.test(req.body.implication) ? 1 : null,
          /organize/.test(req.body.implication) ? 1 : null,
          /hacking/.test(req.body.interest) ? 1 : null,
          /privacy/.test(req.body.interest) ? 1 : null,
          /floss/.test(req.body.interest) ? 1 : null,
          /activity/.test(req.body.contribution) ? 1 : null,
          /propose/.test(req.body.contribution) ? 1 : null,
          /ask/.test(req.body.contribution) ? 1 : null,
          /help/.test(req.body.contribution) ? 1 : null,
          (req.body.other !== '') ? req.body.other : null
        ]);
    });
    db.close();
    res.redirect('/survey');
  });

app.get('/logout', function (req, res){
  req.logout();
  res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
