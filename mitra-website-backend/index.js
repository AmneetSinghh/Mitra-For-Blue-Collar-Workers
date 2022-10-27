const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db/connection");
const cityLib = require("./service/city");
const otpLib = require("./service/otp");
const redisLib = require("./service/redis");
const enums = require("./service/enums");
const userLib = require("./service/users")
const userSessionsLib = require("./service/userSessions")

const { getUserByPhonNumber } = require("./service/users");
// middle ware.
app.use(cors());

app.use(express.json());

// ************************************************* city *************************************************
app.post("/add/cities", async (req, res) => {
    try {
        const { name, pincode, stateName } = req.body;
        console.log(name, pincode, stateName);
        const city = await pool.query("INSERT INTO cities(id,name,pincode,statename,createdat,updatedat,deletedat"
        + ") VALUES(uuid_generate_v4(),$1,$2,$3,now(),now(),null) RETURNING *",
            [name, pincode, stateName]
        );
        return res.json(city.rows);
    } catch (err) {
        console.log(err.message);
        return res.json(err.message);
    }
})

app.get("/get/cities", async (req, res) => {
    try {
        const city = await cityLib.getCities();
        console.log(city);
        return res.json(city.rows);
    } catch (err) {
        console.log(err.message);
        return res.json(err.message);
    }
})


// ************************************************* users *************************************************

// // register the user,
app.post("/register/user", async (req, res) => {
    try {
        const { firstName,lastName,phoneNumber,email,dob,gender,age,motherName,fatherName,city,presentAddress,pancard,adharcard,drivingLicense,qualification,
        experience,currentEmployeer,currentJobRole,salaryPerMonth,languageComfortable,resumeLink } = req.body;
        // check if city is present or not.
        const cityId = await cityLib.getCityIdByName(city);
        if(!cityId){
            throw new Error('city not found');
        }
        const user = await pool.query("INSERT INTO users(id,firstname,lastname,phonenumber,email,dob,gender,age,mothername,fathername,cityid,presentaddress,"
        +"pancard,adharcard,drivinglicense,qualification,experience,currentemployeer,currentjobrole,salarypermonth,languagecomfortable,resumelink,createdat,updatedat,deletedat"
        +")VALUES(uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,now(),now(),null) RETURNING *",
            [firstName, lastName, phoneNumber, email,
                dob, gender, age, motherName, fatherName,
                cityId, presentAddress, pancard,
                adharcard, drivingLicense, qualification,
                experience, currentEmployeer, currentJobRole,
                salaryPerMonth, languageComfortable, resumeLink]
        );
        return res.json({message : 'user registed with mitra successfully', status : 'success', payload : user.rows});
    } catch (err) {
        console.log(err.message);
        return res.json({message : err.message, status : 'failure', payload : null});
    }
})

app.post("/send/opt", async (req, res) => {
    try {
        const {phoneNumber,userId} = req.body;
        const otp = await otpLib.sendOtpToPhoneNumber(phoneNumber);
        const redis = await redisLib.redisClient();
        redis.set(enums.LATEST_SMS_OTP+'_'+userId, otp);
        return res.json({message : 'Otp sent successfully', status : 'success'});
    } catch (err) {
        console.log(err.message);
        return res.json({message : err.message, status : 'failure'});
    }
})

app.post("/login/user", async (req, res) => {
    try {
        const {phonenumber,userid,otp} = req.body;
        const user = await userLib.getUserByPhonNumber(phonenumber);
        if(!user){
            throw new Error('phonenumber not found');
        }
        const redis = await redisLib.redisClient();
        const userOtp = await redis.get(enums.LATEST_SMS_OTP+'_'+userid);
        if(userOtp !== otp){
            throw new Error('wrong otp');
        }
        // create entry into user_sessions.
        await userSessionsLib.insertIntoUserSessions(userid,enums.USER_SESSIONS.ACTIVE);
        return res.json({message : 'user login successfully', status : 'success'});
    } catch (err) {
        console.log(err.message);
        return res.json({message : err.message, status : 'failure'});
    }
})




//********************************************************jobs ************************************* */


// // insert the jobs,
app.post("/add/jobs", async (req, res) => {
    try {
        const { firstName,lastName,phoneNumber,email,dob,gender,age,motherName,fatherName,city,presentAddress,pancard,adharcard,drivingLicense,qualification,
        experience,currentEmployeer,currentJobRole,salaryPerMonth,languageComfortable,resumeLink } = req.body;
        // check if city is present or not.
        const cityId = await cityLib.getCityIdByName(city);
        if(!cityId){
            throw new Error('city not found');
        }
        const user = await pool.query("INSERT INTO users(id,firstname,lastname,phonenumber,email,dob,gender,age,mothername,fathername,cityid,presentaddress,"
        +"pancard,adharcard,drivinglicense,qualification,experience,currentemployeer,currentjobrole,salarypermonth,languagecomfortable,resumelink,createdat,updatedat,deletedat"
        +")VALUES(uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,now(),now(),null) RETURNING *",
            [firstName, lastName, phoneNumber, email,
                dob, gender, age, motherName, fatherName,
                cityId, presentAddress, pancard,
                adharcard, drivingLicense, qualification,
                experience, currentEmployeer, currentJobRole,
                salaryPerMonth, languageComfortable, resumeLink]
        );
        return res.json({message : 'user registed with mitra successfully', status : 'success', payload : user.rows});
    } catch (err) {
        console.log(err.message);
        return res.json({message : err.message, status : 'failure', payload : null});
    }
})


app.listen(5000, () => {
    console.log("Server has started on port 5000");
});


