const app = require("./app");
const config = require("./config/config");

const server = app.listen(config.PORT);

(() => {
  try {
    console.log(`APPLICATION_STARTED`, {
      meta: {
        PORT: config.PORT,
        SERVER_URL: config.SERVER_URL,
      },
    });
  } catch (error) {
    console.log(`APPLICATION_ERROR`, {
      meta: error,
    });
    server.close((error) => {
      if (error) {
        console.error(
          console.log(`APPLICATION_ERROR`, {
            meta: error,
          })
        );
      }
      process.exit(1)
    });
  }
})();
