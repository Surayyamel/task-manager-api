const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'melodyfenton@hotmail.fr',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    });
};

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'melodyfenton@hotmail.fr',
        subject: 'Sorry to see you go!',
        text: `${name}, we are sorry that you are leaving us. Please let us know what we could have done better.`
    });
};

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
};