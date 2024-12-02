require("colors");
const Config = require("./src/config");
const Bot = require("./src/bot");
const initLogger = require("./src/logger");
const { readLines } = require("./src/utils");

async function main() {
  console.log("⏳ Please wait...\n".yellow);

  const config = new Config();
  const logger = initLogger();

  const tokens = await readLines("token.txt");
  const useProxy = true;

  let proxies = [];
  if (useProxy) {
    proxies = await readLines("proxy.txt").then((lines) =>
      lines
        .map((line) => {
          const [host, port, username, password] = line.split(":");
          if (!host || !port) {
            console.log(
              `⚠️  ${"Invalid proxy format in".red} proxy.txt`.yellow
            );
            return null;
          }
          return { host, port, username, password };
        })
        .filter(Boolean)
    );

    if (tokens.length > proxies.length) {
      console.log(
        `⚠️  ${"Not enough proxies for the number of tokens".yellow}`
      );
      return;
    }
  }

  const bot = new Bot(config, logger);

  const singleToken = tokens[0];

  if (useProxy) {
    for (const proxy of proxies) {
      bot
        .connect(singleToken, proxy)
        .catch((err) => console.log(`❌ ${err.message}`.red));
    }
  } else {
    bot
      .connect(singleToken)
      .catch((err) => console.log(`❌ ${err.message}`.red));
  }

  process.on("SIGINT", () => {
    console.log(`\n👋 ${"Shutting down...".green}`);
    process.exit(0);
  });
}

function startHourlyProcess() {
  async function restartProcess() {
    await main().catch((error) => console.log(`❌ ${error.message}`.red));
    console.log("\nProcess finished. Restarting in 1 hour...\n");

    setTimeout(() => {
      restartProcess();
    }, 1000 * 60 * 60 * 24);
  }

  restartProcess();
}

startHourlyProcess();
