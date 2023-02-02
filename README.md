*********************
Welcome to Gravity 🚀
*********************

Thank you for purchasing Gravity, this readme will help you get set up and
running in the next few minutes.


# Requirements

Before you can use the full application without errors, you will need to register
and set up a [Stripe](https://stripe.com) and [Mailgun](https://mailgun) account.

Full instructions on how to do this are provided in the 
[Gravity Documentation](https://docs.usegravity.app)

You will also need an empty relational database. For live deployments, you will
need an SSL certificate installed on your domain. However; this isn't necessary
for building and testing your application.


# Installing Gravity

If you haven't already installed Node.js (15+) on your machine, please download
and install the [latest node version](https://nodejs.org/en/download/)

It's also recommended that you install the 
[node package manager (NPM)](https://www.npmjs.com/) for easy installation 
of Node.js packages from the command line.


### 1. Clone The Repos

*If you downloaded the zip file, you can ignore this step*

Create a new folder for your project and clone all the repos you were 
invited to into the project root, eg.

git clone https://github.com/usegravityapp/server
git clone https://github.com/usegravityapp/client-react-web
git clone https://github.com/usegravityapp/client-react-native (if applicable)
git clone https://github.com/usegravityapp/mission-control

You should now have a folder structure with a server subfolder, mission control
and at least one client folder depending on which plan you purchased.

- server
- client-react-web
- client-react-native 
- mission-control

### 2. Install Packages

Open up a terminal window and navigate into the server folder in 
your project, then run the following command:

npm run setup

This will rename the client folders to 'client' and 'app' and install
the packages for the server and applicable clients.

### 3. Setup Wizard

Open up a new browser window and navigate to http://localhost:3000/setup
which will guide you through the process for setting up your application.

After you have completed the setup process, restart your node server with:

npm run dev

### 3. Mission Control

Please complete steps 2 & 3 inside the mission-control folder to 
install it as a separate application.

### Need Help?

If you need help, please read the [documentation](https://docs.usegravity.app)
or [contact support](mailto:support@usegravity.app)
