require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();

// Railway provides the PORT automatically
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'dashboard-session', 
    resave: false, 
    saveUninitialized: true 
}));

// Middleware for simple password auth
const auth = (req, res, next) => {
    if (req.session.authenticated) next();
    else res.redirect('/login');
};

app.get('/login', (req, res) => res.send('<form method="POST"><input name="pw" type="password"/><button>Login</button></form>'));

app.post('/login', (req, res) => {
    // Uses password from Railway Variables
    if (req.body.pw === process.env.ADMIN_PASSWORD) {
        req.session.authenticated = true;
        res.redirect('/');
    } else res.send('Wrong password');
});

app.get('/', auth, (req, res) => {
    // Create a config-like object from Environment Variables
    const config = {
        logChannelId: process.env.LOG_CHANNEL_ID,
        excludedUsers: process.env.EXCLUDED_USERS ? process.env.EXCLUDED_USERS.split(',') : []
    };
    res.render('index', { config });
});

app.post('/update', auth, (req, res) => {
    // NOTE: On Railway, you cannot programmatically update Env Vars easily.
    // This button will now just show a reminder to update Railway settings.
    res.send('On Railway, please update LOG_CHANNEL_ID and EXCLUDED_USERS in your Railway Dashboard Variables tab.');
});

app.listen(port, () => console.log(`Dashboard running on port ${port}`));
