const nodemailer = require('nodemailer');
const moment = require('moment');
const { htmlTemplate } = require('../templateHTML/mail');

let htmlMsg = (user, confirm) =>
  confirm === true
    ? `<h3> Reserva aceptada! </h3>
   <p> Hola <b>${user?.name ? user?.name : user?.username}</b>! </p>
   <p> Tu reserva en &&AGREGAR ESPACIO&& fue aceptada por el administrador. </p>`
    : `<h3> Reserva denegada! </h3>
   <p> Hola <b>${user?.name ? user?.name : user?.username}</b>! </p>
   <p> Tu reserva en &&AGREGAR ESPACIO&& no fue aceptada por el administrador. </p>`;
let textMsg = (user, confirm) =>
  confirm === true
    ? `Hola${user?.name ? user?.name : user?.username}! 
        Tu reserva en &&AGREGAR ESPACIO&& fue aceptada por el administrador. `
    : `Hola ${user?.name ? user?.name : user?.username}! 
        Tu reserva en &&AGREGAR ESPACIO&& no fue aceptada por el administrador. `;

const createTrans = () => {
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secur: true,
    auth: {
      user: 'takeazoom@gmail.com',
      pass: process.env.MAIL_PASS,
    },
  });
  return transport;
};

const sendMail = async (booking, confirm) => {
  console.log('recibo ' + booking);
  const transporter = createTrans();
  const info = await transporter.sendMail({
    from: 'TakeZoom 🏢',
    to: `${booking?.bookedBy?.email}`,
    subject: confirm === true ? `Reserva aceptada` : `Reserva denegada`,
    html: htmlTemplate(booking, confirm),
  });
  console.log('MENSAJE ENVIADO: %s', info.messageId);
  return;
};

exports.sendMail = (user, confirm) => sendMail(user, confirm);
