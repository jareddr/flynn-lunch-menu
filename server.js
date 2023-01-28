/**
 * This is the main Node.js server script for your project
 * Check out the two endpoints this back-end API provides in fastify.get and fastify.post below
 */

const path = require("path");
const https = require("https");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});

// ADD FAVORITES ARRAY VARIABLE FROM TODO HERE

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// Formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}


async function requestMenu(url) {

  return new Promise((resolve) => {
    let data = "";

    https.get(url, (res) => {
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve(data);
      });
    });
  });
}

/**
 * Our home page route
 *
 * Returns src/pages/index.hbs with data built into it
 */
fastify.get("/", async function (request, reply) {
  // params is an object we'll pass to our handlebars template
  let params = { seo: seo };


    const schoolId = "5a689db7-430e-4563-b9e1-8d02e46913bd";
    const date = new Date().toLocaleDateString();
    //const url = `https://webapis.schoolcafe.com/api/CalendarView/GetDailyMenuitems?SchoolId=${schoolId}&ServingDate=${date}&ServingLine=SFUSD&MealType=Lunch`;
    const weeklyMenuUrl = `https://webapis.schoolcafe.com/api/CalendarView/GetWeeklyMenuitems?SchoolId=${schoolId}&ServingDate=${date}&ServingLine=SFUSD&MealType=Lunch&enabledWeekendMenus=true`
    const response = await requestMenu(weeklyMenuUrl)
    const weeklyMenuData = JSON.parse(response)
    const keys = Object.keys(weeklyMenuData)
    const weekdays = ["","Monday","Tuesday","Wednesday","Thursday","Friday",""]
    const menu = keys.map(k => ({'date': k, 'day': weekdays[new Date(k).getDay()],'lunch': weeklyMenuData[k]['LUNCH- HOT']}))
    // Add the color properties to the params object
    params = {
      seo: seo,
      menu: menu

    };
  // The Handlebars code will be able to access the parameter values and build them into the page
  return reply.view("/src/pages/menu.hbs", params);
});

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
