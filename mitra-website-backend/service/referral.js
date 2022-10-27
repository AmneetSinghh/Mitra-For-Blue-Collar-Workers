const pool = require("../db/connection");

async function insertIntoReferrals(referrerUserId, referralPhoneNumber,status) {
    await pool.query("INSERT INTO referrals(id,referreruserid,referralphonenumber,status,createdat,updatedat,deletedat"
        + ") VALUES(uuid_generate_v4(),$1,$2,$3,now(),now(),null) RETURNING *",
        [referrerUserId, referralPhoneNumber, status]
    );
}

async function getNumberOfReferralsByUserId(userid) {
    const referrals = await pool.query("SELECT * FROM referrals WHERE referreruserid=$1",
        [userid]
    );
    if(referrals && referrals.rows.length>0){
        return referrals.rows;
    }
    return null;
}

module.exports = {
    insertIntoReferrals,
    getNumberOfReferralsByUserId
};