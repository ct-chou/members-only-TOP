require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('node:path');
const { Pool } = require('pg');
// const bcrypt = require('bcryptjs');
// const passport = require('passport');
const { userInfo } = require('node:os');
// const LocalStrategy = require('passport-local').Strategy;

const pool = new Pool({
    host : 'localhost',
    user : process.env.PG_USER,
    password : process.env.PG_PASSWORD,
    database: 'authentication_basics',
    port: process.env.PG_PORT || 5432
});

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});