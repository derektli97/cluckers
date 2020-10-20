const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");

const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
  console.log("Quackers Ready!");
});

client.once("reconnecting", () => {
  console.log("Quackers Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Quackers Disconnect!");
});




client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
  } else if (message.content.startsWith(`${prefix}queue`)) {
    currentq(message, serverQueue);
    return;
  } else {
    message.channel.send("You need to enter a valid command!");
  }
});


// main execution code - where everything is running

// Sending message in the channel
// message.channel.send(`Welcome to Quackers, the fake Rythm Bot`);

async function execute(message, serverQueue) {
  const args = message.content.split(" ");
  // message.channel.send(`Welcome to Quackers, the fake Rythm Bot`);

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  
  // Checking for permissions - needed to run in a channel
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} has been added to the queue!`);
  }
}


function skip(message, serverQueue) {
  console.log("Skipping")
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();
}

// Stop command just disconnects the bot
function stop(message, serverQueue) {
  console.log("Stopping")
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  console.log("Playing")
  const serverQueue = queue.get(guild.id);
  if (!song) {
    console.log("Leaving voice channel - play")
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection.play(ytdl(song.url, {quality: 'highestaudio', highWaterMark: 1 << 25})).on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

function currentq(message, serverQueue) {
  console.log("Current Queue")
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to check the current queue of the music!"
    );
  if (!serverQueue)
    return message.channel.send("!serverQueue: " + String(serverQueue));
  
  if(serverQueue.songs.length == 1){
    return serverQueue.textChannel.send("Queue: " + serverQueue.songs.length + " song");
  }
  else{
    return serverQueue.textChannel.send("Queue: " + serverQueue.songs.length + " songs");
  }
}

// function currentq(message, serverQueue) {
//   console.log("Current Queue")
//   if (!message.member.voice.channel)
//     return message.channel.send(
//       "You have to be in a voice channel to check the current queue of the music!"
//     );
//   if (!serverQueue)
//     return message.channel.send("!serverQueue: " + String(serverQueue));
//   serverQueue.textChannel.send("Queue: " + serverQueue.songs.length + " song");
// }

client.login(token);