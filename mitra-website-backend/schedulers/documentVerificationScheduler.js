const cron = require('node-cron');
const jobLib = require("../service/jobs");
const enums = require("../service/enums");


async function documentVerificationScheduler() {
    console.log("documentVerificationScheduler started at : ", new Date())

    try{
        const documentVerification = await jobLib.getDocumentVerificationAndJobsStatusByStatus(enums.JOB_STATUSES.PENDING, enums.JOB_STATUSES.FAILED);
        for (let i = 0; i < documentVerification.length; i++) {// check for every job.
            let nextJobLevel = true;
            if (documentVerification[i].requirements && documentVerification[i].requirements.documents) {
                // job require documents
                let documents = documentVerification[i].requirements.documents;
                let validDocuments = 0;
                for(let j=0;j<documents.length;j++){
                    if(documents[j] === enums.DOCUMENTS.PANCARD && documentVerification[i].pancard){
                        validDocuments++;
                    }
                    if(documents[j] === enums.DOCUMENTS.ADHARCARD && documentVerification[i].adharcard){
                        validDocuments++;
                    }
                    if(documents[j] === enums.DOCUMENTS.DRIVING_LICENSE && documentVerification[i].drivinglicense){
                        validDocuments++;
                    }
                }
                if(validDocuments !== documents.length){
                    nextJobLevel = false;
                    await jobLib.updateDocumentVerificationStatus(enums.JOB_STATUSES.FAILED,documentVerification[i].userid,documentVerification[i].jobid);
                    // entry to user_job_level_failures;
                    let reasonoffailure = 'Required Documents : {'+documents +'} not uploaded';
                    await jobLib.insertIntoUserJobLevelFailures(documentVerification[i].userid,
                    documentVerification[i].jobid,enums.JOB_STATUS_LEVELS.DOCUMENT_VERIFICATION,reasonoffailure);
                    // update the status into redis.    
                    await jobLib.updateJobStatusInRedis(documentVerification[i].userid,documentVerification[i].jobid,enums.JOB_STATUS_LEVELS.DOCUMENT_VERIFICATION,enums.JOB_STATUSES.FAILED,reasonoffailure);
    
                }
            }
          
            console.log("Next job level",nextJobLevel);
            if(nextJobLevel === true){
                // update documentverification status
                await jobLib.updateDocumentVerificationStatus(enums.JOB_STATUSES.PASSED,documentVerification[i].userid,documentVerification[i].jobid);
                // update the status into redis.    
                await jobLib.updateJobStatusInRedis(documentVerification[i].userid,documentVerification[i].jobid,enums.JOB_STATUS_LEVELS.BACKGROUND_CHECK,enums.JOB_STATUSES.PENDING,'');
                // add into background check with status pending
                await jobLib.insertIntoBackgroundCheck(documentVerification[i].userid,documentVerification[i].jobid,enums.JOB_STATUSES.PENDING);
            }
        }
    
    } catch(err){
        console.log(err);
    }
    console.log("documentVerificationScheduler ended at : ", new Date())

}


cron.schedule("*/10 * * * * *", async () => documentVerificationScheduler());// run every 10 seconds. in Actual we have to run 1 time in night in one day.
