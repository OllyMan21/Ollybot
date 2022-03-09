// Require the necessary discord.js classes
const DiscordJS = require('discord.js');
const { token } = require('./config.json');
const { Controller } = require('./controller');

// Create a new client instance
const client = new DiscordJS.Client({ intents: [DiscordJS.Intents.FLAGS.GUILDS, DiscordJS.Intents.FLAGS.GUILD_MESSAGES] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Ready!');
});

let controller = new Controller();

client.on("messageCreate", (message) => {
    if (message.content.toLowerCase() == "math bot go") {
        const game = controller.startGame();
        if (!game) {
            message.reply("Game already running!");
            return;
        } else {
            message.channel.send(`Try to create ${game.target} using the numbers ${game.comps}`);
        }

        const filter = m => game.checkExpr(m.content);
        const collector = message.channel.createMessageCollector({filter});

        game.finishCallback = () => {
            collector.stop();

            let str = "Game ended!\n\n";
            for (let i = 0; i < game.finalRanks.length; ++i) {
                str += `${i + 1}. ${client.users.cache.find(user => user.id == game.finalRanks[i].ID)}`;
                if (i < game.finalRanks.length - 1) {
                    str += "\n";
                }
            }
            message.channel.send(str);

            return;
        }

        collector.on("collect", (m) => {
            if (game.checkAns(m.content)) {
                const [exprEval, diff] = game.submitAns(m.author.id, m.createdTimestamp, m.content);
                m.reply(`\`\`\`Result: ${exprEval}\nDifference: ${diff}\`\`\``);
            } else {
                m.reply("You either used a number that is not in the list or too many of the same number(s)!");
            }
        });
    }
});

// Login to Discord with your client's token
client.login(token);