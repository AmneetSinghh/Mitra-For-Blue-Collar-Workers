const cron = require('node-cron');
const jobLib = require("../service/jobs");
const enums = require("../service/enums");

/*
users_table               jobs_requirements
qualification        :       education
experience           :       jobTypeExperience
languagecomfortable  :       englishProficiency
*/

async function backgroundCheckScheduler() {
    console.log("backgroundCheckScheduler started at : ", new Date())

    try {
        const backgroundCheck = await jobLib.getBackgroundCheckAndJobsStatusByStatus(enums.JOB_STATUSES.PENDING, enums.JOB_STATUSES.FAILED);
        for (let i = 0; i < backgroundCheck.length; i++) {// check for every job.
            let nextJobLevel = false,isQualificationVerified = false, isJobExperienceVerified = false, isEnglishProficiencyVerified = false;
            if (backgroundCheck[i].requirements) {
                if (backgroundCheck[i].requirements.education.length > 0) {
                    console.log("******************** education ***************")
                    let education = backgroundCheck[i].requirements.education;
                    education.find((value, index) => {
                        if (value.toLowerCase().trim() === backgroundCheck[i].qualification.toLowerCase().trim()) isQualificationVerified = true;
                    });
                    console.log(education, backgroundCheck[i].qualification, isQualificationVerified);
                }
                else isQualificationVerified = true;

                if (backgroundCheck[i].requirements.jobTypeExperience.length > 0) {
                    console.log("******************** jobTypeExperience ***************")
                    let experience = backgroundCheck[i].requirements.jobTypeExperience;
                    experience.find((value, index) => {
                        if (value.toLowerCase().trim() === backgroundCheck[i].experience.toLowerCase().trim()) isJobExperienceVerified = true;
                    });
                    console.log(experience, backgroundCheck[i].experience, isJobExperienceVerified);
                }
                else isJobExperienceVerified = true;

                if (backgroundCheck[i].requirements.englishProficiency.length > 0) {
                    console.log("******************** englishProficiency ***************")
                    if (backgroundCheck[i].languagecomfortable && backgroundCheck[i].languagecomfortable === 'english') isEnglishProficiencyVerified = true;
                    console.log(backgroundCheck[i].requirements.englishProficiency, backgroundCheck[i].languagecomfortable, isEnglishProficiencyVerified);
                }
                else isEnglishProficiencyVerified = true;

                if (isQualificationVerified === true && isJobExperienceVerified === true && isEnglishProficiencyVerified === true) {
                    nextJobLevel = true;
                }
                console.log("******************** nextJobLevel ***************", nextJobLevel);
            } else nextJobLevel = true;




            if (nextJobLevel === false) {
                await jobLib.updateBackgroundCheckStatus(enums.JOB_STATUSES.FAILED, backgroundCheck[i].userid, backgroundCheck[i].jobid);
                // entry to user_job_level_failures;
                let reasonoffailure = 'Background_Check failed : (';
                if(!isQualificationVerified)reasonoffailure+=('Required qualifications -> ['+ backgroundCheck[i].requirements.education)+']\n';
                if(!isJobExperienceVerified)reasonoffailure+=('Required experience -> ['+ backgroundCheck[i].requirements.jobTypeExperience)+']\n';
                if(!isEnglishProficiencyVerified)reasonoffailure+=('Required EnglishProficiency -> ['+ backgroundCheck[i].requirements.englishProficiency)+']\n';
                reasonoffailure +=')';
                console.log(reasonoffailure)
                await jobLib.insertIntoUserJobLevelFailures(backgroundCheck[i].userid,
                    backgroundCheck[i].jobid, enums.JOB_STATUS_LEVELS.BACKGROUND_CHECK, reasonoffailure);
                // update the status into redis.    
                await jobLib.updateJobStatusInRedis(backgroundCheck[i].userid, backgroundCheck[i].jobid, enums.JOB_STATUS_LEVELS.BACKGROUND_CHECK, enums.JOB_STATUSES.FAILED, reasonoffailure);
            }
            else {
                // update backgroundCheck status
                await jobLib.updateBackgroundCheckStatus(enums.JOB_STATUSES.PASSED, backgroundCheck[i].userid, backgroundCheck[i].jobid);
                // update the status into redis.    
                await jobLib.updateJobStatusInRedis(backgroundCheck[i].userid, backgroundCheck[i].jobid, enums.JOB_STATUS_LEVELS.SCHEDULED_INTERVIEWS, enums.JOB_STATUSES.PENDING, '');
                // add into scheduled inerviews check with status pending
                await jobLib.insertIntoScheduledInterviews(backgroundCheck[i].userid, backgroundCheck[i].jobid, enums.JOB_STATUSES.PENDING);
            }
        }

    } catch (err) {
        console.log(err);
    }
    console.log("backgroundCheckScheduler ended at : ", new Date())

}


// cron.schedule("*/10 * * * * *", async () => backgroundCheckScheduler());// run every 10 seconds. in Actual we have to run 1 time in night in one day.

