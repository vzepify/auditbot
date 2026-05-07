require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();

// Use Railway's dynamic port
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'dev-secret', 
    resave: false, 
    saveUninitialized: true 
}));

const auth = (req, res, next) => {
    if (req.session.authenticated) next();
    else res.redirect('/login');
};

app.get('/login', (req, res) => res.send('<form method="POST"><input name="pw" type="password"/><button>Login</button></form>'));

app.post('/login', (req, res) => {
    // Check against Railway variable
    if (req.body.pw === process.env.ADMIN_PASSWORD) {
        req.session.authenticated = true;
        res.redirect('/');
    } else res.send('Wrong password');
});

app.get('/', auth, (req, res) => {
    // Show current settings from Env Vars
    const config = {
        logChannelId: process.env.LOG_CHANNEL_ID,
        excludedUsers: process.env.EXCLUDED_USERS ? process.env.EXCLUDED_USERS.split(',') : []
    };
    res.render('index', { config });
});

app.listen(port, () => console.log(`Dashboard running on port ${port}`));
