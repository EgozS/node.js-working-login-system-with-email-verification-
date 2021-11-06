const express = require('express')
const app = express()
const port = 80 
const mysql = require('mysql')
var randtoken = require('rand-token');
var bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const nodemailer = require("nodemailer");


app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

//connect to database
const db = mysql.createConnection({
    host: 'localhost',
    user: '',
    password: '',
    database: 'copilot'
})


function generateRandomId(length) {
    var result           = '';
    var characters       = '0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   db.query('SELECT * FROM accounts WHERE Id = ?', [result], function(err, rows, fields) {
       if (err) throw err
       if (rows.length > 0) {
        generateRandomId(length)
       } else {
           return result
       }
   })
   return result;
}

function sendEmail(email, token) {
 
    var email = email;
    var token = token;
 
    var mail = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: '', // email addres
            pass: '' // email password
        }
    });
 
    var mailOptions = {
        from: '', //sender
        to: email,
        subject: 'Email verification - test',
        html: '<p>You requested for email verification, kindly use this <a href="http://localhost:80/verify-email?token=' + token + '">link</a> to verify your email address</p>'
 
    };
 
    mail.sendMail(mailOptions, function(error, info) {
        if (error) {
            return 1
        } else {
            return 0
        }
    });
}


app.use(bodyParser.json())


app.get('/', (req, res) => {
  res.render('index')
})

app.get('/login', (req, res) => {
    res.render('login', {error: ""})
})

app.get('/register', (req, res) => {
    res.render('register', {error: ""})
})

app.get('/ver', (req, res) => {
    res.render('index')
})

app.get('/panel', (req, res) => {
    res.render('index')
})

//make a post /register and hash password before insterting into database and check if the user exists if it does send error
app.post('/register', (req, res) => 
{
    Id = generateRandomId(18)
    var username = req.body.username
    var password = req.body.password
    var email = req.body.email
    var salt = bcrypt.genSaltSync(10)
    var hash = bcrypt.hashSync(password, salt)
    var query = "SELECT * FROM accounts WHERE username = '" + username + "' OR email = '" + email + "'" 
    db.query(query, (err, result) => {
        if(err) throw err
        if(result.length > 0){
            res.render('register', {error: "Username or email already exists"})
        }
        else{
            var query = "INSERT INTO accounts (Id, username, password, email) VALUES ('" + Id + "', '" + username + "', '" + hash + "', '" + email + "')"
            db.query(query, (err, result) => {
                if(err) throw err;
                res.render('login', {error: "account created, please login"})
            })
        }
    })
})





app.post('/login', (req, res) => {
    username = req.body.username
    password = req.body.password

    db.query('SELECT username FROM accounts WHERE username = (?)', [username], (err, results) => {
        if (err) {
            console.log(err)}
        else {
            if (results.length > 0) {
                db.query('SELECT * FROM accounts WHERE username = (?)', [username], (err, results) => {
                    if (err) {
                        console.log(err)}
                    else {
                        if (results[0].verify === "0" || results[0].verify === 0 || results[0].verify === false){
                            if (bcrypt.compareSync(password, results[0].Password)) {
                                res.render('ver', {error: "please verify your email address"})
                            } else {
                                res.render('login', {error:"Username or Password is invalid"})
                            }
                        }
                        else if (results[0].verify === "1" || results[0].verify === 1 || results[0].verify === true){
                            res.render('panel', {error:"Welcome back!"})
                        }
                        else {
                            console.log(results[0].verify)
                        }
                        
                    }
                })
            } else {
                res.render('login', {error: "Username or Password is invalid"})
            }
        }
    })
        
        

})


app.post('/send-email', function(req, res, next) {
 
    var email = req.body.email;
 
    //console.log(sendEmail(email, fullUrl));
 
    db.query('SELECT * FROM accounts WHERE email ="' + email + '"', function(err, result) {
        if (err) throw err;
         
        var type = 'success'
        var msg = 'Email already verified'
   

        
        if (result.length > 0) {
 
           var token = randtoken.generate(20);
            var veri = result[0].verify;
           if(veri == 0 ){
             var sent = sendEmail(email, token);
             if (sent != '0') {
 
 
                var data = {
                    token: token
                }
 
 
                db.query('UPDATE accounts SET ? WHERE email ="' + email + '"', data, function(err, result) {
                    if(err) throw err
                })
 
                type = 'success';
                msg = 'The verification link has been sent to your email address';
 
            } else {
                type = 'error';
                msg = 'Something goes to wrong. Please try again';
            }
           }
 
 
        } else {
            console.log('2');
            type = 'error';
            msg = 'The Email is not registered with us';
 
        }
    

        res.render('ver', {error:msg});
    });
})

app.get('/verify-email', function(req, res, next) {
    var token = req.query.token;
    db.query('SELECT * FROM accounts WHERE token ="' + token + '"', function(err, result) {
         if (err) throw err;
  
         var type
         var msg
         
          if(result[0].verify == 0){
             if (result.length > 0) {
  
                 //var data = {
                   //  verify: 1
                 //}
  
                 db.query('UPDATE accounts set verify = true WHERE email ="' + result[0].Email + '"', function(err, result) {
                     if(err) throw err
                    console.log("ver")
                 })
                 type = 'success';
                 msg = 'Your email has been verified';
               
             } else {
                 console.log('2');
                 type = 'success';
                 msg = 'The email has already verified';
  
             }
          }else{
             type = 'error';
             msg = 'The email has been already verified';
          }
  
         
         res.render('panel', {error: msg});
     });
 })

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})