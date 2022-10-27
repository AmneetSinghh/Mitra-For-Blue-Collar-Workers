const pool = require("../db/connection");


async function getJobs() {
    const jobs = await pool.query("SELECT * from jobs;");
    return jobs.rows;
}


async function getDocumentVerificationStatusByUserIdAndJobId(userid,jobid) {
    const documentVerification = await pool.query("SELECT * from document_verification where userid=$1 and jobid=$2;",
        [userid,jobid]
    );
    if (documentVerification && documentVerification.rows.length > 0) {
        return documentVerification.rows;
    }
    return null;
}

async function getDocumentVerificationAndJobsStatusByUserId(userid) {// from new to old.
    const jobs = await pool.query("select j.* from document_verification dc "+
    "JOIN jobs j on dc.jobid = j.id where dc.userid =$1 order by dc.createdat desc ",
        [userid]
    );
    if (jobs && jobs.rows.length > 0) {
        return jobs.rows;
    }
    return null;
}

async function insertIntoDocumentVerification(userid,jobid,status) {
    const documentVerification = await pool.query("INSERT INTO document_verification(id,userid,jobid,status,createdat,updatedat,deletedat"
        + ") VALUES(uuid_generate_v4(),$1,$2,$3,now(),now(),null) RETURNING *",
            [userid, jobid, status]
        );
        return documentVerification;
}
module.exports = {
    getJobs,
    getDocumentVerificationStatusByUserIdAndJobId,
    insertIntoDocumentVerification,
    getDocumentVerificationAndJobsStatusByUserId
};