const axios = require('axios');

async function sendSms(phone,otp){
  const data = JSON.stringify([
    {
        scheduledTime: null,
        campaignName: 'test',
        phoneNumber: phone,
        templateId:'1607100000000070142',
        arguments: [otp],
        retryOnFailure: 'false',
    },
]);
 await axios.post('http://13.126.55.9:9101/sms/smsRequests',data,{
  headers:{
    'Content-Type': 'application/json',
  }
 });

}

module.exports = {
  sendSms
};



