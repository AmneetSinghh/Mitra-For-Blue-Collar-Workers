const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db/connection");
const cityLib = require("./service/city");
const otpLib = require("./service/otp");
const redisLib = require("./service/redis");
const enums = require("./service/enums");
const userLib = require("./service/users");
const companyLib = require("./service/company");
const jobLib = require("./service/jobs");
const userSessionsLib = require("./service/userSessions");
const referralLib = require("./service/referral");
const backgroundCheckScheduler = require("./schedulers/backgroundCheckScheduler");


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
        console.log("Hitting add cities api")
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
        // console.log(city);
        return res.json(city.rows);
    } catch (err) {
        console.log(err.message);
        return res.json(err.message);
    }
})


// ************************************************* sign up and login  *************************************************

// // register the user,
app.post("/register/user", async (req, res) => {
    try {
        const { firstname, lastname, phonenumber, email, dob, gender, age, mothername, fathername, city, presentaddress, pancard, adharcard, drivinglicense, qualification,
            experience, currentemployeer, currentjobrole, salarypermonth, languagecomfortable, resumelink } = req.body;

        
        // check user already registered.
        const isUserPresent = await userLib.getUserByPhonNumber(phonenumber);
        if (isUserPresent) {
            throw new Error('User already exists. Please login into our website');
        }
        // check if city is present or not.
        let cityid=null;
        if(city != null){
            cityid = await cityLib.getCityIdByName(city);
            if (!cityid) {
                throw new Error('city not found');
            }
        }
        const user = await pool.query("INSERT INTO users(id,firstname,lastname,phonenumber,email,dob,gender,age,mothername,fathername,cityid,presentaddress,"
            + "pancard,adharcard,drivinglicense,qualification,experience,currentemployeer,currentjobrole,salarypermonth,languagecomfortable,resumelink,createdat,updatedat,deletedat"
            + ")VALUES(uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,now(),now(),null) RETURNING *",
            [firstname, lastname, phonenumber, email,
                dob, gender, age, mothername, fathername,
                cityid, presentaddress, pancard,
                adharcard, drivinglicense, qualification,
                experience, currentemployeer, currentjobrole,
                salarypermonth, languagecomfortable, resumelink]
        );
        return res.json({ message: 'user registed with mitra successfully', status: 'success', payload: user.rows });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure', payload: null });
    }
})

app.post("/send/opt", async (req, res) => {
    try {
        const { phonenumber, userid } = req.body;
        console.log(phonenumber,userid);
        const otp = await otpLib.sendOtpToPhoneNumber(phonenumber);
        const redis = await redisLib.redisClient();
        redis.set(enums.LATEST_SMS_OTP + '_' + userid, otp);
        return res.json({ message: 'Otp sent successfully', status: 'success' });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure' });
    }
})

app.post("/login/user", async (req, res) => {
    try {
        const { phonenumber, userid, otp } = req.body;
        // already logined into our website, then why again and again
        const userSession = await userSessionsLib.getLatestUserSession(userid);
        console.log(userSession)
        if (userSession === enums.USER_SESSIONS.ACTIVE) {
            return res.json({ message: 'You already login into our website', status: 'success' });
        }

        const user = await userLib.getUserByPhonNumber(phonenumber);
        if (!user) {
            throw new Error('phonenumber not found');
        }
        const redis = await redisLib.redisClient();
        const userOtp = await redis.get(enums.LATEST_SMS_OTP + '_' + userid);
        if (userOtp !== otp) {
            throw new Error('wrong otp');
        }
        // create entry into user_sessions.
        await userSessionsLib.insertIntoUserSessions(userid, enums.USER_SESSIONS.ACTIVE);
        return res.json({ message: 'user login successfully', status: 'success' });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure' });
    }
})




//*******************************************************  JOBS *********** ************************************* */


// // insert the jobs,
app.post("/add/jobs", async (req, res) => {
    try {

        const { jobrole, jobdescription, requirements,
            basesalary, maxearnings, joiningbonus, referralbonus,
            benefitsmetadata, isparttimeavailable, company, city,
            joblink, jobtype, joblocation, contactpersonname, contactpersonphoneNumber } = req.body;

        const companyId = await companyLib.getCompanyByName(company);
        if (!companyId) {
            throw new Error('city not found');
        }
        const cityId = await cityLib.getCityIdByName(city)
        if (!cityId) {
            throw new Error('city not found');
        }
        const job = await pool.query("INSERT INTO jobs(id,jobrole,jobdescription,requirements,basesalary,maxearnings,joiningbonus,referralbonus,benefitsmetadata,isparttimeavailable,companyid,cityid,"
            + "joblink,jobtype,joblocation,contactpersonname,contactpersonphonenumber,createdat,updatedat,deletedat"
            + ")VALUES(uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,now(),now(),null) RETURNING *",
            [jobrole, jobdescription, requirements, basesalary,
                maxearnings, joiningbonus, referralbonus, benefitsmetadata,
                isparttimeavailable, companyId, cityId, joblink, jobtype,
                joblocation, contactpersonname, contactpersonphoneNumber]
        );
        return res.json({ message: 'job added to mitra_db successfully', status: 'success', payload: job.rows });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure', payload: null });
    }
})


app.get("/get/notAppliedJobs", async (req, res) => {
    try {
        const userId = req.param('userid');
        const userSession = await userSessionsLib.getLatestUserSession(userId);
        console.log("Session-> ",userSession)
        if (userSession !== enums.USER_SESSIONS.ACTIVE) {
            throw new Error("please login to access new jobs");
        }
        const jobs = await jobLib.getJobs();
        let notAppliedJobs = [];
        for (let job = 0; job < jobs.length; job++) {

            const documentVerification = await jobLib.getDocumentVerificationStatusByUserIdAndJobId(userId, jobs[job].id);
            if (documentVerification == null) {
                notAppliedJobs.push(jobs[job]);
            }
        }
        console.log(notAppliedJobs.length);
        return res.json({ message: null, status: 'success', payload: notAppliedJobs });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure', payload: null });
    }
})

app.post("/apply/job", async (req, res) => {
    try {
        const { userid, jobid } = req.body;// user want to apply for this jobId.
        // create entry into document_verification table with status pending.
        console.log("Entering in apply job",userid,jobid);
        const documentVerification = await jobLib.insertIntoDocumentVerification(userid, jobid, enums.JOB_STATUSES.PENDING);
        const jobStatus = {
            level: enums.JOB_STATUS_LEVELS.DOCUMENT_VERIFICATION,
            status: enums.JOB_STATUSES.PENDING,
            message: 'Document verification stage is ' + (enums.JOB_STATUSES.PENDING).toLowerCase()
        }
        const redis = await redisLib.redisClient();
        redis.set(enums.CURRENT_JOB_STATUS + '_' + jobid + '_' + userid, JSON.stringify(jobStatus));
        return res.json({ message: 'job applied successfully', status: 'success', payload: null });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure', payload: null });
    }
})

// ******************************************************* JOBS STATUS *******************************************************************888

app.get("/get/jobStatus", async (req, res) => {
    try {
        const userId = req.param('userid');
        const userSession = await userSessionsLib.getLatestUserSession(userId);
        if (userSession !== enums.USER_SESSIONS.ACTIVE) {
            throw new Error("please login to access job status page");
        }

        const jobs = await jobLib.getDocumentVerificationAndJobsStatusByUserId(userId);// all the jobs that are present in document verification table for user x.
        for (let job = 0; job < jobs.length; job++) {
            // For this job check status, level and message from redis.
            const redis = await redisLib.redisClient();
            let jobStatus = await redis.get(enums.CURRENT_JOB_STATUS + '_' + jobs[job].id + '_' + userId);// in redis every key is stored as string.
            jobStatus = JSON.parse(jobStatus);// convert string to json
            jobs[job].status = jobStatus.status;
            jobs[job].level = jobStatus.level;
            jobs[job].message = jobStatus.message;
        }
        // console.log(jobs);
        let jobLevels = [];
        jobLevels.push("JOB APPLIED")
        jobLevels.push(enums.JOB_STATUS_LEVELS.DOCUMENT_VERIFICATION);
        jobLevels.push(enums.JOB_STATUS_LEVELS.BACKGROUND_CHECK);
        jobLevels.push(enums.JOB_STATUS_LEVELS.SCHEDULED_INTERVIEWS);
        jobLevels.push(enums.JOB_STATUS_LEVELS.HIRED);
        return res.json({ message: null, status: 'success', jobs, jobStatus: enums.JOB_STATUSES, jobLevels });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure', payload: null });
    }
})


app.post("/update/scheduledInterviewStatus", async (req, res) => {
    try {
        const {userid,jobid,status,message} = req.body;
        await jobLib.updateSchduledInterviewsStatus(status, userid,jobid);
        if(status === enums.JOB_STATUSES.FAILED){
            await jobLib.insertIntoUserJobLevelFailures(userid,jobid, enums.JOB_STATUS_LEVELS.SCHEDULED_INTERVIEWS, message);
            await jobLib.updateJobStatusInRedis(userid,jobid, enums.JOB_STATUS_LEVELS.SCHEDULED_INTERVIEWS, enums.JOB_STATUSES.FAILED, message);
        }
        else{
            // candidate is hired by the company.
            await jobLib.updateJobStatusInRedis(userid,jobid, enums.JOB_STATUS_LEVELS.HIRED, enums.JOB_STATUSES.PASSED, '');
        }

        return res.json({ message: 'updated status for candidate', status: 'success', payload: null });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure', payload: null });
    }
})


// ************************************************* PROFILE **************************************************************************
app.patch("/profile/update", async (req, res) => {
    try {

        console.log("I am here")


        const { firstname, lastname, phonenumber, email, dob, gender, age, mothername, fathername, city, presentaddress, pancard, adharcard, drivinglicense, qualification,
            experience, currentemployeer, currentjobrole, salarypermonth, languagecomfortable, resumelink,userid } = req.body;

        console.log(req.body);
        const userSession = await userSessionsLib.getLatestUserSession(userid);
        if (userSession !== enums.USER_SESSIONS.ACTIVE) {
            throw new Error("please login to access profile page");
        }

        // check if city is present or not.
        let cityid = null;
        if (city !== null) {
            cityid = await cityLib.getCityIdByName(city);
            if (!cityid) {
                throw new Error('city not found');
            }
        }


        const user = await pool.query("UPDATE users set firstname=$1,lastname=$2,phonenumber=$3,email=$4," +
            "dob=$5,gender=$6,age=$7,mothername=$8,fathername=$9," +
            "cityid=$10,presentaddress=$11,pancard=$12,adharcard=$13," +
            "drivinglicense=$14,qualification=$15,experience=$16,currentemployeer=$17," +
            "currentjobrole=$18,salarypermonth=$19,languagecomfortable=$20,resumelink=$21,updatedat=now()" +
            "WHERE id=$22 RETURNING *",
            [firstname, lastname, phonenumber, email,
                dob, gender, age, mothername, fathername,
                cityid, presentaddress, pancard,
                adharcard, drivinglicense, qualification,
                experience, currentemployeer, currentjobrole,
                salarypermonth, languagecomfortable, resumelink,userid]
        );

        return res.json({ message: 'Profile updated successfully', status: 'success', payload: null });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure', payload: null });
    }
})


app.post("/profile/logout", async (req, res) => {
    try {
        const {userid } = req.body;
        console.log("Logout: ",userid);
        // just make a entry into user sessions table with status closed.
        await userSessionsLib.insertIntoUserSessions(userid, enums.USER_SESSIONS.CLOSED);
        return res.json({ message: 'Profile logout successfully', status: 'success', payload: null });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure', payload: null });
    }
})

app.get("/profile/userDetails", async (req, res) => {
    try {

        const userId = req.param('userid');
        // console.log(userId);
        const user = await userLib.getUserByUserId(userId);
        // console.log(user);
        return res.json({ message: null, status: 'success', payload: user });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure', payload: null });
    }
})



// ************************************************* REFERRALS **************************************************************************
app.post("/refer", async (req, res) => {
    try {

        const {referrerUserId, referralPhoneNumber} = req.body;
        console.log(referrerUserId,referralPhoneNumber)
        await referralLib.insertIntoReferrals(referrerUserId,referralPhoneNumber,enums.REFERRAL_STATUS.INITIATED)
        return res.json({ message: 'referred', status: 'success', payload: null });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure', payload: null });
    }
})

app.get("/countReferrals", async (req, res) => {
    try {
        const userid = req.param('userid');
        const referrals = await referralLib.getNumberOfReferralsByUserId(userid);
        let initiated=[],pending=[],progress=[],referred=[];
        for(let i=0;i<referrals.length;i++){
            if(referrals[i].status === enums.REFERRAL_STATUS.INITIATED){
                initiated.push(referrals[i]);
            }
            if(referrals[i].status === enums.REFERRAL_STATUS.PENDING){
                pending.push(referrals[i]);
            }
            if(referrals[i].status === enums.REFERRAL_STATUS.PROGRESS){
                initiated.push(progress[i]);
            }
            if(referrals[i].status === enums.REFERRAL_STATUS.REFERRED){
                referred.push(referrals[i]);
            }
        }
        return res.json({ message: null, status: 'success', initiated,pending,progress,referred });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure', payload: null });
    }
})



// user sessions.
app.get("/get/session", async (req, res) => {
    try {
        const userId = req.param('userid');
        const userSession = await userSessionsLib.getLatestUserSession(userId);
        return res.json({ message: null, status: 'success', payload: userSession });
    } catch (err) {
        console.log(err.message);
        return res.json({ message: err.message, status: 'failure', payload: null });
    }
})


app.listen(5000, () => {
    console.log("Server has started on port 5000");
});


