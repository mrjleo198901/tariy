const config = require('config');
const domain = config.get('domain');
const account = require('../model/account');
const mail = require('../model/mail');
const invite = require('../model/invite');
const utility = require('../model/utilities');


/*
* invite.create()
* invite a new user to join an account
*/

exports.create = async function(req, res){

  let data = req.body, invites = [];
  utility.validate(data, ['email']);

  const accountData = await account.get(req.account);
  utility.assert(accountData, 'Account does not exist');

  if (data.permission === 'owner')
    throw { message: 'Permission can be only owner or admin' }

  // split emails
  const emails = data.email.replace(' ', '').split(',');
  const permission = data.permission;

  // check length
  if (emails.length > 10)
    res.status(500).send({ inputError: 'email', message: 'Max 10 emails per invite' });

  // invite each user
  for (email of emails){

    // has user been invited?
    data = await invite.get(null, email, req.account);

    if (data) await invite.update(data.id, { date_sent: new Date() })
    else data = await invite.create(email, permission, req.account);

    invites.push(data);
              
    await mail.send({
      to: email,
      template: 'invite',
      content: {

        friend: accountData.owner_name,
        id: data.id,
        email: data.email,
        domain: utility.validateNativeURL(req.body.url) || `${domain}/signup/user`

      }
    });
  }

  const msg = emails.length > 1 ? 'Invites sent' : 'Invite sent';
  return res.status(200).send({ message: msg, data: invites });

};

/*
* user.invite.delete()
* delete a user invite
*/

exports.delete = async function(req, res){

  utility.validate(req.body, ['id']);
  await invite.delete(req.body.id, req.account);
  return res.status(200).send({ message: 'Invite deleted', data: req.body });

}
