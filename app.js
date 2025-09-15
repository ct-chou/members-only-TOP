require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('node:path');
const { Pool } = require('pg');
// const bcrypt = require('bcryptjs');
const passport = require('passport');
const { userInfo } = require('node:os');
const LocalStrategy = require('passport-local').Strategy;
// const userRouter = require('./routes/userRouter');


const pool = new Pool({
    host : 'localhost',
    user : process.env.PG_USER,
    password : process.env.PG_PASSWORD,
    database: 'members_only_top',
    port: process.env.PG_PORT || 5432
});

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const {rows} = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
            const user = rows[0];
            // const match = await bcrypt.compare(password, user.password);

            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (user.password !== password) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            // if (!match) {
            //     return done(null, false, { message: 'Incorrect password.' });
            // }
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
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        const user = rows[0];
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
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => res.render('index', { user: req.user }));


app.get('/sign-up', (req, res) => res.render('sign-up-form'));
app.post('/sign-up', async (req, res, next) => {
    try {
        await pool.query("INSERT INTO users (first_name, last_name, username, password) VALUES ($1, $2, $3, $4)", [
            req.body.first_name,
            req.body.last_name,
            req.body.username,
            req.body.password, // In a real app, hash the password before storing it
        ]);
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