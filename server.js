const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'dashboard-session', resave: false, saveUninitialized: true }));

const CONFIG_PATH = './config.json';

// Middleware for simple password auth
const auth = (req, res, next) => {
    if (req.session.authenticated) next();
    else res.redirect('/login');
};

app.get('/login', (req, res) => res.send('<form method="POST"><input name="pw" type="password"/><button>Login</button></form>'));
app.post('/login', (req, res) => {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH));
    if (req.body.pw === config.adminPassword) {
        req.session.authenticated = true;
        res.redirect('/');
    } else res.send('Wrong password');
});

app.get('/', auth, (req, res) => {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH));
    res.render('index', { config });
});

app.post('/update', auth, (req, res) => {
    let config = JSON.parse(fs.readFileSync(CONFIG_PATH));
    config.logChannelId = req.body.channelId;
    
    // Convert comma-separated string to array
    config.excludedUsers = req.body.excluded.split(',').map(id => id.trim()).filter(id => id);
    
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    res.redirect('/');
});

app.listen(port, () => console.log(`Dashboard running on http://localhost:${port}`));