const pool = require("../db/connection");
const redisLib = require("../service/redis");
const enums = require("../service/enums");



async function getJobs() {
    const jobs = await pool.query("select j.*,c.name as companyname,cty.name as cityname from jobs j join companies c on j.companyid=c.id join cities cty on j.cityid=cty.id;");
    return jobs.rows;
}


async function getDocumentVerificationStatusByUserIdAndJobId(userid, jobid) {
    const documentVerification = await pool.query("SELECT * from document_verification where userid=$1 and jobid=$2;",
        [userid, jobid]
    );
    if (documentVerification && documentVerification.rows.length > 0) {
        return documentVerification.rows;
    }
    return null;
}

async function getDocumentVerificationAndJobsStatusByUserId(userid) {// from new to old.
    const jobs = await pool.query("select j.*,c.name as companyname from document_verification dc " +
        "JOIN jobs j on dc.jobid = j.id JOIN companies c on j.companyid = c.id where dc.userid =$1 order by dc.createdat desc ",
        [userid]
    );
    if (jobs && jobs.rows.length > 0) {
        return jobs.rows;
    }
    return null;
}

async function getDocumentVerificationAndJobsStatusByStatus(failed, pending) {// from new to old.
    const jobs = await pool.query("select j.*,u.*,u.id as userid,j.id as jobid from document_verification dc " +
        "JOIN jobs j on dc.jobid = j.id "
        +"JOIN users u on dc.userid = u.id "
        + "WHERE dc.status in ($1,$2) order by dc.createdat desc ",
        [failed, pending]
    );
    if (jobs && jobs.rows.length > 0) {
        return jobs.rows;
    }
    return null;
}

async function getBackgroundCheckAndJobsStatusByStatus(failed, pending) {// from new to old.
    const jobs = await pool.query("select j.*,u.*,u.id as userid,j.id as jobid from background_check dc " +
        "JOIN jobs j on dc.jobid = j.id "
        +"JOIN users u on dc.userid = u.id "
        + "WHERE dc.status in ($1,$2) order by dc.createdat desc ",
        [failed, pending]
    );
    if (jobs && jobs.rows.length > 0) {
        return jobs.rows;
    }
    return null;
}

async function updateDocumentVerificationStatus(status,userid,jobid) {// from new to old.
    await pool.query("UPDATE document_verification SET status = $1 WHERE userid = $2 and jobid = $3 ",
        [status,userid,jobid]
    );
}

async function updateBackgroundCheckStatus(status,userid,jobid) {// from new to old.
    await pool.query("UPDATE background_check SET status = $1 WHERE userid = $2 and jobid = $3 ",
        [status,userid,jobid]
    );
}

async function updateSchduledInterviewsStatus(status,userid,jobid) {// from new to old.
    await pool.query("UPDATE scheduled_interviews SET status = $1 WHERE userid = $2 and jobid = $3 ",
        [status,userid,jobid]
    );
}

async function insertIntoDocumentVerification(userid, jobid, status) {
    const documentVerification = await pool.query("INSERT INTO document_verification(id,userid,jobid,status,createdat,updatedat,deletedat"
        + ") VALUES(uuid_generate_v4(),$1,$2,$3,now(),now(),null) RETURNING *",
        [userid, jobid, status]
    );
    return documentVerification;
}

async function insertIntoBackgroundCheck(userid, jobid, status) {
    const backgroundCheck = await pool.query("INSERT INTO background_check(id,userid,jobid,status,createdat,updatedat,deletedat"
        + ") VALUES(uuid_generate_v4(),$1,$2,$3,now(),now(),null) RETURNING *",
        [userid, jobid, status]
    );
    return backgroundCheck;
}

async function insertIntoScheduledInterviews(userid, jobid, status) {
    const scheduledInterviews = await pool.query("INSERT INTO scheduled_interviews(id,userid,jobid,status,createdat,updatedat,deletedat"
        + ") VALUES(uuid_generate_v4(),$1,$2,$3,now(),now(),null) RETURNING *",
        [userid, jobid, status]
    );
    return scheduledInterviews;
}

async function insertIntoUserJobLevelFailures(userid, jobid, failurelevel,reasonoffailure) {
    await pool.query("INSERT INTO user_job_level_failures(id,userid,jobid,failurelevel,reasonoffailure,createdat,updatedat,deletedat"
        + ") VALUES(uuid_generate_v4(),$1,$2,$3,$4,now(),now(),null) RETURNING *",
        [userid, jobid, failurelevel,reasonoffailure]
    );
}

async function updateJobStatusInRedis(userId, jobId, level, status, message) {
    let jobStatus = {
        level: level,
        status: status,
        message: message
    }
    const redis = await redisLib.redisClient();
    await redis.set(enums.CURRENT_JOB_STATUS + '_' + jobId + '_' + userId, JSON.stringify(jobStatus));
}

module.exports = {
    getJobs,
    getDocumentVerificationStatusByUserIdAndJobId,
    insertIntoDocumentVerification,
    getDocumentVerificationAndJobsStatusByUserId,
    getDocumentVerificationAndJobsStatusByStatus,
    updateDocumentVerificationStatus,
    insertIntoUserJobLevelFailures,
    insertIntoBackgroundCheck,
    getBackgroundCheckAndJobsStatusByStatus,
    updateBackgroundCheckStatus,
    insertIntoScheduledInterviews,
    updateSchduledInterviewsStatus,
    updateJobStatusInRedis
};