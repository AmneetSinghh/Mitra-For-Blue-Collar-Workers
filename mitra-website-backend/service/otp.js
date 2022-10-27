const smsLib = require('../service/sms')

async function generateOtp() {
    var val = Math.floor(1000 + Math.random() * 9000);
    return val;
}


async function sendOtpToPhoneNumber(phoneNumber){
 const otp = await generateOtp();
 await smsLib.sendSms(phoneNumber,otp);
 return otp;
}

module.exports = {
    generateOtp,
    sendOtpToPhoneNumber,
};
