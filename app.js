require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { userInfo } = require('node:os');
const LocalStrategy = require('passport-local').Strategy;
const queries = require('./db/queries');
const { body, validationResult } = require('express-validator');

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

app.get('/', async (req, res, next) => {
    try {
        const messages = await queries.getAllMessages();
        // console.log(messages);
        if(req.user) {
            res.render('index', { user: req.user, messages });
        } else {
            res.render('index', { user: req.user, 
                messages: messages.map(msg => { return { message: msg.message }; }) } ); // Hide usernames if not logged in
        }
    } catch (err) {
        return next(err);
    }
});

app.get('/posts', async (req, res, next) => {
    try {
        const messages = await queries.getAllMessages();
        res.render('posts', { user: req.user, messages });
    } catch (err) {
        return next(err);
    }
});
app.get('/new-post', (req, res) => res.render('new-post', { user: req.user }));
app.post('/posts/new',
    body('message').notEmpty().withMessage('Message cannot be empty').isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('new-post', { 
                    errors: errors.array(),
                    formData: req.body  // Keep the form data to repopulate fields
                });
            }
            if (!req.user) {
                return res.status(401).send('Unauthorized');
            }
            await queries.insertNewMessage(req.user.id, req.body.message);
            res.redirect('/posts');
        } catch (err) {
            return next(err);
        }
    }
);  
app.get('/success', (req, res) => res.render('success', { user: req.user }));
app.get('/secret', (req, res) => res.render('secret', { user: req.user }));
app.post('/secret', [
    body('secretCode').custom(value => {
        if (value !== "SECRET") {
            throw new Error('Incorrect secret code');
        }
        return true;
    })
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('secret', { 
                    errors: errors.array(),
                    formData: req.body  // Keep the form data to repopulate fields
                });
            }
            if (!req.user) {
                return res.status(401).send('Unauthorized');
            }
            if (req.body.secretCode === "SECRET") {
                console.log(`username is ${req.user.username}`);
                await queries.updateUserMemberStatus(req.user.username, 'member');
                return res.redirect('/success');
            }
            else {
                return res.redirect('/secret');
            }
            
        } catch (err) {
            return next(err);
        }
    }
);

app.get('/sign-up', (req, res) => res.render('sign-up-form'));
app.post('/sign-up', [
        body('username').isEmail().withMessage('Username must be a valid email address'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('confirm_password').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        }),
        body('first_name').notEmpty().withMessage('First name is required'),
        body('last_name').notEmpty().withMessage('Last name is required'),
        body('username').custom(async (value) => {
            const user = await queries.findUserByUsername(value);
            if (user) {
                throw new Error('Username already in use');
            }
            return true;
        })
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('sign-up-form', { 
                    errors: errors.array(),
                    formData: req.body  // Keep the form data to repopulate fields
                });
            }
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            const newUser = await queries.insertNewUser(req.body.first_name, req.body.last_name, req.body.username, hashedPassword);
            
            req.login(newUser, (err) => {
                if (err) {
                    return next(err);
                }
                return res.redirect('/secret');
            });
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