const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
//mailer
const transporter = nodemailer.createTransport(smtpTransport({
    name: `${process.env.EMAILNAME}`,
    host: `${process.env.EMAILHOST}`,
    secureConnection: true,
    tls: {
        rejectUnauthorized: false
    },
    port: 465,
    auth: {
        user: process.env.EMAILFROM,
        pass: process.env.EMAILPASSWORD,
    }
}));

module.exports={
    syncMail: async (email,subject,message,attachments=null) => {
        try{
            await transporter.sendMail({
                from: {
                    name: 'ACE GIFTING',
                    address: process.env.EMAILFROM
                },
                to: email,
                subject: subject,
                html: message,
                attachments:attachments
            })
        }catch(err) {console.error(err)}
    },

    asyncMail: (email,subject,message) => {
        return new Promise(async (resolve, reject) => {
            await transporter.sendMail({
                from: {
                    name: 'ACE GIFTING',
                    address: process.env.EMAILFROM
                },
                to: email,
                subject: subject,
                html: message
            }, async (err, info) => {
                if (err) {
                    reject('Email Sending Failed');
                }else{
                    resolve('Email Sending Successful')
                }
            })
        })
    },

}