const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db/connection");
const cityLib = require("./service/city");
const otpLib = require("./service/otp");
const redisLib = require("./service/redis");
const enums = require("./service/enums");
const userLib = require("./service/users");
const companyLib = require("./service/company")
const jobLib = require("./service/jobs")
const userSessionsLib = require("./service/userSessions")

const { getUserByPhonNumber } = require("./service/users");
const { user } = require("pg/lib/defaults");
// middle ware.
app.use(cors());

app.use(express.json());

// ************************************************* companies *************************************************
app.post("/add/company", async (req, res) => {
    try {
        const { name } = req.body;
        const company = await companyLib.insertCompany(name);
        return res.json(company.rows);
    } catch (err) {
        console.log(err.message);
        return res.json(err.message);
    }
})

// ************************************************* city *************************************************
app.post("/add/city", async (req, res) => {
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

        const { jobrole,jobdescription,requirements,
            basesalary,maxearnings,joiningbonus,referralbonus,
            benefitsmetadata,isparttimeavailable,company,city,
            joblink,jobtype,joblocation,contactpersonname,contactpersonphoneNumber} = req.body;

            const companyId = await companyLib.getCompanyByName(company);
            if(!companyId){
                throw new Error('city not found');
            }
            const cityId = await cityLib.getCityIdByName(city)
            if(!cityId){
                throw new Error('city not found');
            }
        const job = await pool.query("INSERT INTO jobs(id,jobrole,jobdescription,requirements,basesalary,maxearnings,joiningbonus,referralbonus,benefitsmetadata,isparttimeavailable,companyid,cityid,"
        +"joblink,jobtype,joblocation,contactpersonname,contactpersonphonenumber,createdat,updatedat,deletedat"
        +")VALUES(uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,now(),now(),null) RETURNING *",
            [jobrole,jobdescription,requirements,basesalary,
                maxearnings,joiningbonus,referralbonus,benefitsmetadata,
                isparttimeavailable,companyId,cityId,joblink,jobtype,
                joblocation,contactpersonname,contactpersonphoneNumber]
        );
        return res.json({message : 'job added to mitra_db successfully', status : 'success', payload : job.rows});
    } catch (err) {
        console.log(err.message);
        return res.json({message : err.message, status : 'failure', payload : null});
    }
})


app.get("/get/notAppliedJobs", async (req, res) => {
    try {
        const userId = req.param('userId');
        const userSession = await userSessionsLib.getLatestUserSession(userId);
        if(userSession !== enums.USER_SESSIONS.ACTIVE){
            throw new Error("please login to access new jobs");
        }
        const jobs = await jobLib.getJobs();
        let notAppliedJobs = [];
        for(let job =0;job<jobs.length;job++){
            
            const documentVerification = await jobLib.getDocumentVerificationStatusByUserIdAndJobId(userId,jobs[job].id);
            if(documentVerification == null){
                notAppliedJobs.push(jobs[job]);
            }
        }
        return res.json({message : null, status : 'success', payload : notAppliedJobs});
    } catch (err) {
        console.log(err.message);
        return res.json({message : err.message, status : 'failure', payload : null});
    }
})

app.post("/apply/job", async (req, res) => {
    try {
        const {userId,jobId} = req.body;// user want to apply for this jobId.
        // create entry into document_verification table with status pending.
        const documentVerification  = await jobLib.insertIntoDocumentVerification(userId,jobId,enums.JOB_STATUSES.PENDING);
        const jobStatus = {
            level : enums.JOB_STATUS_LEVELS.DOCUMENT_VERIFICATION,
            status : enums.JOB_STATUSES.PENDING,
            message : 'Document verification stage is '+ (enums.JOB_STATUSES.PENDING).toLowerCase()
        }
        const redis = await redisLib.redisClient();
        redis.set(enums.CURRENT_JOB_STATUS+'_'+jobId+'_'+userId, JSON.stringify(jobStatus));
        return res.json({message : 'job applied successfully', status : 'success', payload : null});
    } catch (err) {
        console.log(err.message);
        return res.json({message : err.message, status : 'failure', payload : null});
    }
})


app.listen(5000, () => {
    console.log("Server has started on port 5000");
});


