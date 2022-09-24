const { Expo } = require('expo-server-sdk');
const chalk = require('chalk');
const user = require('./user');
const pushtoken = require('./pushtoken');
const expo = new Expo();

async function send(tokens, message){

  console.log('Sending push notification');

  let messages = [], tickets = [];
  if (typeof tokens === 'string') tokens = [tokens]; // format single token

  if (tokens && tokens.length){
    for (let token of tokens) {

      token = 'ExponentPushToken[' + token + ']';

      // check token is valid
      if (!Expo.isExpoPushToken(token)){

        console.log(chalk.red(token + ' is not a valid Expo push token'));
        continue;

      }

      // construct the message
      messages.push({

        to: token,
        title: message.title,
        body: message.body,
        sound: message.sound ? message.sound : 'default',
        data: message.data ? { withSome: message.data } : {},

      });
    }

    // send the notifications
    tickets = await expo.sendPushNotificationsAsync(messages);
    tickets.forEach((ticket, index) => ticket.token = tokens[index]);
    getReceipts(tickets);

  }
  else {

    console.warn(chalk.yellow('Please provide at least one push token'));
    return false;

  }
}

async function getReceipts(tickets){

  console.log('Push notification sent');
  console.log(tickets);

  let receiptIds = [], receipts = [];

  // get the receipt ids
  for (let ticket of tickets){
    switch (ticket.status){

      case 'ok':
      receiptIds.push(ticket.id);
      break;

      case 'error':
      console.log(chalk.red(ticket.details.error));
      break;

    }
  }

  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

  for (let chunk of receiptIdChunks){

    // receipts specify whether Apple/Google successfully received the
    // notification and information about an error, if one occurred.
    let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
    if (typeof receipts === 'object') receipts = [receipts];

    for (let receipt of receipts){

      Object.keys(receipt).map(key => {

        key = receipt[key];

        if (key.status === 'error' && key.details && key.details.error) {

          console.log(chalk.red('There was an error sending a notification: ' + key.message));
          console.log(chalk.red('Error code: ' +  key.details.error));

          switch (key.details.error){

            case 'DeviceNotRegistered':
            const ticket = tickets.find(x => x.id === key);
            pushtoken.delete(ticket.token);
            break;

          }
        }
      });
    }
  }
}

exports.send = send;