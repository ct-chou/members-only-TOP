require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { userInfo } = require('node:os');
const LocalStrategy = require('passport-local').Strategy;
const queries = require('./db/queries');

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await queries.findUserByUsername(username);
            const match = await bcrypt.compare(password, user.password);

            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (!match) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await queries.findUserById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize()); 
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => res.render('index', { user: req.user }));


app.get('/sign-up', (req, res) => res.render('sign-up-form'));
app.post('/sign-up', 
    async (req, res, next) => {
        try {
            const user = await queries.findUserByUsername(req.body.username);
            if (user) {
                throw new Error('Username already in use');
            }
            const passwordMatch = req.body.password === req.body.confirm_password;
            if (!passwordMatch) {
                throw new Error('Passwords do not match');
            }
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            
            await queries.insertNewUser(req.body.firstName, req.body.lastName, req.body.username, hashedPassword);
            res.redirect('/');
        } catch (err) {
            console.error(err);
            return next(err);
        }
    });

app.post('/log-in', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/'
}));

app.get('/log-out', (req, res, next) => {
    req.logout(err => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});