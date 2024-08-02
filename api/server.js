const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors'); // cross origin resource sharing
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

//Allow to send interact with our data and front_end without getting errors(usin the json format)
app.use(express.json());
app.use(cors());
dotenv.config();

//connecting to the database
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
}
) 
//TEXT CONNECTION
db.connect((err)=>{
    // CONNECTION DOES NOT WORK
    if(err) return console.log('error connecting to MySQL')
    //CONNECTION WORKS
    console.log("Connected TO MySQL as id :", db.threadId);

    //create a datbase 
    db.query('CREATE DATABASE IF NOT EXISTS expense_tracker',(err,result) =>{
        //error creating database
        if(err) return console.log('error creating database')
        //no error
        console.log("db expense_tracker created/checked successfully");
        //select the db expense_tracker
        db.changeUser({database : 'expense_tracker'},(err,result)=>{
            // if err in selecting db
            if (err) return console.log('error in selecting db')
            //if no error
            console.log('epense_tracker is in use')
            //create table
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users(
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    username VARCHAR(50) NOT NULL,
                    password VARCHAR(255) NOT NULL
                    
                )
            `;
            db.query(createUsersTable,(err,result)=>{
                // if error creating table
                if(err) return console.log("error creating table")
                // if no error
                console.log("users table is checked successfully");
            })
        })
    })
})

/* C R U D
app.post()
app.get()
app.put()
app.delete */

//user registration
app.post('/api/register',async(req,res)=>{
    try {
        const users = `SELECT * FROM users WHERE email = ?`
        db.query(users,[req.body.email],(err,data)=>{
            // if email exists
            if (data.length>0) return res.status(409).json("User already exists")
            //if no email exist
            //password hashing
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(req.body.password, salt);
            //create new user
            const newUser = `INSERT INTO users(email,username,password) VALUES(?,?,?)`
            value = [req.body.email,req.body.username,hashedPassword]
            console.log("Inserting user with values:",value)
            db.query(newUser,value,(err,data)=>{
                //if insert user failerror
                if(err){
                    console.error("Insert user error:",err);
                    return res.status(400).json("something went wrong");}
                // if return user successfully
                console.log("User created successfully");
                res.status(200).json("User created successfully");
            })
        })
    } 
    catch (err) {
        console.error("Internal server error:",err);
        res.status(500).json('Internal server error');
    }

})

//user login
app.post('/api/login',async(req,res)=> {
    try {
        const users = `SELECT * FROM users WHERE email = ?`
        db.query(users,[req.body.email],(err,data)=>{
            //if user not found
            if(data.length == 0) {
                console.log("User not found");
                return res.status(404).json("User  not found");}
            // if user exist
            const isPasswordValid = bcrypt.compareSync(req.body.password, data[0].password)
            //password not valid if(isPasswordValid === false)
            if(!isPasswordValid) return res.status(400).json("Invalid password or email")
            //passwords and email match
            console.log("Login successful");
            return res.status(201).json("Login successfully")
        })
    } catch (err) {
        console.error("Internal server error:",err);
        res.status(500).json('Internal server error');
    }
})

app.listen(3000,() =>{
    console.log('The server is running');
})
