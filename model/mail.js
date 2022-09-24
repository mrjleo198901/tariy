const config = require('config');
const domain = config.get('domain');
const settings = config.get('mailgun');
const file = require('fs').promises;
const chalk = require('chalk');
const axios = require('axios');
const FormData = require('form-data');
const emails = require('../emails/content');

/*
* mail.send()
* send an email using mailgun
* data: to (email address), content (values to inject), custom (optional: custom html template)
*/

exports.send = async function(data){

	// validate email address
	const rex = /^(?:[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+)*|'(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*')@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/

	if (rex.test(data.to)){

		// get content from json
		const content = emails[data.template];
		const html = await createEmail(data.custom || 'template', content, data.content); // create html template

		const form = new FormData();
		form.append('to', data.to);
		form.append('from', settings.sender);
		form.append('subject', content?.subject || data?.subject)
		form.append('html', html);
	
		await axios({ 
			
			method: 'POST',
			url: `${settings.base_url}/${settings.domain}/messages`,
			headers: { 'Content-Type': `multipart/form-data; boundary=${form._boundary}` },
			data: form,
			auth: {
				username: 'api',
				password: process.env.MAILGUN_API_KEY
			}
		});
		
		console.log(chalk.green('Email sent to: ') + data.to);

	}
	else {

		throw ({ message: 'Invalid email address '});

	}
}

/*
* createEmail()
* opens an html email template and injects content into the {}
* template: name of the html file located in /emails (default: template.html)
* content: object containing body and button
* inject: values to inject to content
*/

async function createEmail(template, content, values){

	// get the template
	let email = await file.readFile(`emails/${template}.html`, 'utf8');
	email = email.replace(/{{domain}}/g, values?.domain || domain);

	// generate dynamic email
	if (content){

		// set default title if not specified
		content.title = content.title || content.subject;

		// inject domain?
		if (content.button.url?.includes('{{domain}}'))
			content.button.url = content.button.url.replace(/{{domain}}/g, values?.domain || domain)

		// inject new lines
		content.body = content.body.split('\n');

		if (content.name)
			content.body.unshift(`Hi ${content.name},`)
		
		content.body.forEach((line, i) => {

			content.body[i] = 
			`<p style="color: #7e8890; font-family: 'Source Sans Pro', helvetica, sans-serif; font-size: 15px; font-weight: normal; Margin: 0; Margin-bottom: 15px; line-height: 1.6;">${line}</p>`

		});

		content.body = content.body.join('\n');

		email = email.replace(/{{title}}/g, content.title);
		email = email.replace('{{body}}', content.body);
		email = email.replace('{{buttonURL}}', content.button.url);
		email = email.replace('{{buttonLabel}}', content.button.label);

		// inject content into {{braces}}
		if (values){
			for (key in values){
				
				const rex = new RegExp(`{{content.${key}}}`, 'g');
				email = email.replace(rex, values[key]);
				
			}
		}
	}

	return email;

}
