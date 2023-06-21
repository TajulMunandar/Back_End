import express from 'express';
import mysql from 'mysql';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import  jwt  from 'jsonwebtoken';
import crypto from 'crypto';

const app = express();
app.use(cors({
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET"],
    credentials: true
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized:false,
    cookie: {
        secure:false,
        maxAge: 1000 * 60 * 60 * 24
    }
}))

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "inventaris-gubsu2"
})

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if(!token){
        return res.json({Message: "we need token please provide it for next time"})
    } else{
        jwt.verify(token, "our-json-secret-key", (err, decoded) =>{
            if(err){
                return res.json({Message: "Authentication Error."})
            } else {
                req.username = decoded.username;
                next();
            }
        })
    }
}

app.get('/logout', (req, res) => {
    res.clearCookie('token')
    return res.json({valid: false})
})

app.get('/dashboard', verifyUser, (req, res) => {
    if(req.session.username){
        return res.json({valid: true, username: req.session.username})
    }else{
        return res.json({valid: false})
    }
})

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Hash password using MD5
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex');

    const sql = "SELECT * FROM users WHERE username = ? and password = ?"
    db.query(sql, [username, hashedPassword], (err, result) => {
        if(err) return res.json({Message: "Eror inside server"});
        if(result.length > 0) {
            req.session.username = result[0].username;
            const name = req.session.username;
            const token = jwt.sign({name}, "our-json-secret-key", {expiresIn: '1d'});
            res.cookie('token', token);
            return res.json({Login: true, username: req.session.username});
        }else {
            return res.json({Login: false})
        }
    })
})

app.get('/dashboard-kategori', (req, res) => {
    const sql = "SELECT * FROM kategoris";
    db.query(sql, (err, result) => {
      if (err) {
        return res.json({ Message: "Error inside server" });
      }
      return res.json(result);
    });
  });

app.listen(8000, ()=>{
    console.log("Connected to the server")
})